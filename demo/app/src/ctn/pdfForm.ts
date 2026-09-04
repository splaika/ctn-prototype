// ============================================================================
// 届書PDF レンダラ（公式様式の再現）
// ----------------------------------------------------------------------------
// formTree.ts が組み立てた届書ツリーを A4 に描く。html2canvas でのラスタライズを
// やめ、pdf-lib で文字を直接描画する。理由は3つ:
//   ・公式出力と同じ座標に1文字単位で置ける（ラスタライズでは寄せられない）
//   ・文字が本物のテキストとして残る（検索・コピーができる。公式出力もそう）
//   ・拡大しても滲まない
//
// 【レイアウト定数の出所】
// 参照出力（AMG 410 第1回・13ページ）を実測して決めた。日本語のみの行では
// 予測幅と実測幅の誤差が 0.00pt で一致することを確認済み。推測値ではない。
//
// 【フォント】
// 公式出力は MS明朝。MS明朝は再配布できないため、メトリックが完全に同一の
// IPA明朝を使う（半角0.5em・全角1.0em が MS明朝と一致するので、文字位置・
// 折り返し位置・行数がずれない）。字形はごくわずかに異なる。
// ============================================================================
import { PDFDocument, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { FormDocument, FormNode } from "./formTree";

// ---------------------------------------------------------------------------
// 実測レイアウト定数（参照出力より）
// ---------------------------------------------------------------------------
export const LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  fontSize: 9,
  /** 宛名（独立行政法人…殿）だけ大きい */
  addresseeSize: 14.04,
  /** 行送り。実測 (758.64-88.05)/45 */
  linePitch: 14.902,
  /** 1行目の行ボックス上端 */
  firstLineTop: 88.05,
  /** 1ページの行数 */
  linesPerPage: 46,
  /** 行ボックス上端からベースラインまで（9pt 実測 7.73 → 0.859em） */
  ascentRatio: 7.73 / 9,
  /** 項目名の左端（インデント段ごと） */
  labelX: [79.46, 85.76, 92.06, 98.3, 104.66, 111.02, 117.38],
  /** 値の左端（インデント段ごと。公式出力もわずかに右へずれる） */
  valueX: [259.49, 260.33, 261.29, 262.13, 263.09, 264.05, 265.01],
  /** 本文の右端（折り返し位置） */
  rightEdge: 519.0,
  /** ページ番号のベースライン（下端からの高さ） */
  pageNoBaseline: 841.89 - 789.7,
  /** 1ページ目で本文ツリーが始まる行番号（宛名部が 0〜10 を使う） */
  bodyStartLine: 11,
  /** 宛名の行ボックス上端（フォントが大きいのでグリッド外） */
  addresseeTop: 107.84,
  /** 宛名部の各行の行番号 */
  headerLines: { noteDate: 0, sponsorName: 4, repName: 5, address1: 6, address2: 7 },
};

// ---------------------------------------------------------------------------
// 文字幅（MS明朝／IPA明朝は半角0.5em・全角1.0em の固定ピッチ）
// ---------------------------------------------------------------------------
/**
 * 全角として扱う範囲。East Asian Width の W/F/A に相当する部分を実用範囲で列挙する。
 * 半角カナ（FF61-FF9F）は半角なので除外していることに注意。
 */
const FULL_WIDTH =
  /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︐-︙︰-﹯＀-｠￠-￦]/;

/** 1文字の幅（em）。サロゲートペア（追加漢字面）は全角として扱う */
function charEm(ch: string): number {
  const cp = ch.codePointAt(0) ?? 0;
  if (cp >= 0x20000 && cp <= 0x3ffff) return 1; // CJK 拡張B以降
  if (cp >= 0x1f000) return 1;
  return FULL_WIDTH.test(ch) ? 1 : 0.5;
}

/** 文字列の描画幅（pt） */
export function textWidth(s: string, size = LAYOUT.fontSize): number {
  let em = 0;
  for (const ch of s) em += charEm(ch);
  return em * size;
}

/** 指定幅で折り返す。日本語は語間が無いので文字単位で折る（公式出力と同じ挙動） */
export function wrapText(s: string, maxWidth: number, size = LAYOUT.fontSize): string[] {
  if (!s) return [];
  const out: string[] = [];
  for (const paragraph of s.split(/\r?\n/)) {
    if (paragraph === "") {
      out.push("");
      continue;
    }
    let line = "";
    let w = 0;
    for (const ch of paragraph) {
      const cw = charEm(ch) * size;
      if (w + cw > maxWidth && line !== "") {
        out.push(line);
        line = ch;
        w = cw;
      } else {
        line += ch;
        w += cw;
      }
    }
    out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// ツリー → 行の列
// ---------------------------------------------------------------------------
interface RenderLine {
  /** 描画テキストと x 座標の組（1行に項目名と値が並ぶ） */
  cells: { x: number; text: string }[];
}

/** 1ノードを行に展開する。項目名が値の位置を越える場合は値を項目名の直後に置く */
function nodeToLines(node: FormNode, level: number): RenderLine[] {
  const lv = Math.min(level, LAYOUT.labelX.length - 1);
  const lx = LAYOUT.labelX[lv];
  const vx = LAYOUT.valueX[lv];
  const lines: RenderLine[] = [];

  // 項目名（長い場合は本文右端で折り返す）
  const labelLines = wrapText(node.label, LAYOUT.rightEdge - lx);
  const value = node.value ?? "";

  if (!value) {
    for (const t of labelLines) lines.push({ cells: [{ x: lx, text: t }] });
    return lines;
  }

  // 項目名の最終行の右端が値の位置を越えるか
  const lastLabel = labelLines[labelLines.length - 1];
  const lastRight = lx + textWidth(lastLabel);
  const inline = lastRight + LAYOUT.fontSize * 0.5 > vx;
  const valueLeft = inline ? lastRight + LAYOUT.fontSize * 0.5 : vx;

  const valueLines = wrapText(value, LAYOUT.rightEdge - valueLeft);
  // 2行目以降は値の桁位置へ戻す（公式出力もそうなっている）
  const contWidth = LAYOUT.rightEdge - vx;
  const first = valueLines.shift() ?? "";
  const rest = valueLines.length ? wrapText(valueLines.join(""), contWidth) : [];

  labelLines.forEach((t, i) => {
    if (i < labelLines.length - 1) lines.push({ cells: [{ x: lx, text: t }] });
    else lines.push({ cells: [{ x: lx, text: t }, { x: valueLeft, text: first }] });
  });
  for (const t of rest) lines.push({ cells: [{ x: vx, text: t }] });
  return lines;
}

function treeToLines(nodes: FormNode[], level = 0, acc: RenderLine[] = []): RenderLine[] {
  for (const node of nodes) {
    acc.push(...nodeToLines(node, level));
    if (node.children) treeToLines(node.children, level + 1, acc);
  }
  return acc;
}

// ---------------------------------------------------------------------------
// 描画
// ---------------------------------------------------------------------------
const baselineY = (lineIndex: number): number =>
  LAYOUT.pageHeight - (LAYOUT.firstLineTop + lineIndex * LAYOUT.linePitch + LAYOUT.fontSize * LAYOUT.ascentRatio);

function drawLine(page: PDFPage, font: PDFFont, line: RenderLine, lineIndex: number): void {
  const y = baselineY(lineIndex);
  for (const cell of line.cells) {
    if (!cell.text) continue;
    page.drawText(cell.text, { x: cell.x, y, size: LAYOUT.fontSize, font });
  }
}

export interface RenderFormOptions {
  /** IPA明朝など、半角0.5em・全角1.0em の日本語フォント（TTF/OTF） */
  fontBytes: Uint8Array | ArrayBuffer;
}

/**
 * 届書ツリーを A4 の PDF にする。
 * 既存の PDFDocument に足したい場合は doc を渡す（添付の結合で使う）。
 */
export async function renderFormPdf(
  form: FormDocument,
  opts: RenderFormOptions,
  doc?: PDFDocument
): Promise<PDFDocument> {
  const pdf = doc ?? (await PDFDocument.create());
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(opts.fontBytes, { subset: true });

  const bodyLines = treeToLines(form.body);
  const pages: PDFPage[] = [];
  const newPage = () => {
    const p = pdf.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
    pages.push(p);
    return p;
  };

  // ---- 1ページ目の宛名部 ----
  let page = newPage();
  const H = LAYOUT.headerLines;
  const h0 = LAYOUT.labelX[0];
  const v0 = LAYOUT.valueX[0];
  drawLine(page, font, { cells: [{ x: h0, text: "届出年月日" }, { x: v0, text: form.header.noteDate }] }, H.noteDate);
  page.drawText(form.header.addressee, {
    x: h0,
    y: LAYOUT.pageHeight - (LAYOUT.addresseeTop + LAYOUT.addresseeSize * LAYOUT.ascentRatio),
    size: LAYOUT.addresseeSize,
    font,
  });
  drawLine(page, font, { cells: [{ x: h0, text: "届出者の名称" }, { x: v0, text: form.header.sponsorName }] }, H.sponsorName);
  drawLine(page, font, { cells: [{ x: h0, text: "届出者の（代表者の）氏名" }, { x: v0, text: form.header.sponsorRepName }] }, H.repName);
  drawLine(page, font, { cells: [{ x: h0, text: "所在地１" }, { x: v0, text: form.header.sponsorAddress1 }] }, H.address1);
  drawLine(page, font, { cells: [{ x: h0, text: "所在地２" }, { x: v0, text: form.header.sponsorAddress2 }] }, H.address2);

  // ---- 本文 ----
  let lineIndex = LAYOUT.bodyStartLine;
  for (const line of bodyLines) {
    if (lineIndex >= LAYOUT.linesPerPage) {
      page = newPage();
      lineIndex = 0;
    }
    drawLine(page, font, line, lineIndex);
    lineIndex++;
  }

  // ---- ページ番号（下部中央）----
  pages.forEach((p, i) => {
    const s = String(i + 1);
    p.drawText(s, {
      x: (LAYOUT.pageWidth - textWidth(s)) / 2,
      y: LAYOUT.pageNoBaseline,
      size: LAYOUT.fontSize,
      font,
    });
  });

  return pdf;
}
