// ============================================================================
// 提出パッケージ出力（PDF＋XML）
// ----------------------------------------------------------------------------
// ① CTN XML（generateCtnXml）
// ② 届書PDF：formTree.ts の届書ツリーを pdfForm.ts が A4 に直接描画する。
//    以前は印刷ビューを html2canvas でラスタライズしていたが、公式様式と
//    見た目が全く違ううえ画像なので文字が残らなかった。公式出力（PMDA 届書
//    作成支援システム）を実測して座標を合わせた描画に置き換えている。
// ③ 添付「検査キット/パッキングリスト」があれば、実PDFを②に結合して1ファイル化
//    （デモは実ファイルが無いためサンプルPDFを生成。本番は SharePoint の実体）
// ============================================================================
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateCtnXml, type XmlContext } from "./xml";
import { buildFormDocument } from "./formTree";
import { renderFormPdf } from "./pdfForm";
import type { Notification } from "./types";
import { DOC_TYPE } from "./refData";

const A4 = { w: 595.28, h: 841.89 };

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// デモ用サンプル Packing List（ASCII・標準フォント＝日本語フォント埋め込み不要）
async function makeSamplePackingList(title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4.w, A4.h]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = A4.h - 60;
  page.drawText("LAB KIT PACKING LIST", { x: 50, y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.1) });
  y -= 14;
  page.drawText("Demo sample attached by CTN Suite - replace with the real file in production.", { x: 50, y, size: 8, font, color: rgb(0.45, 0.45, 0.45) });
  y -= 28;
  page.drawText(`Reference: ${title}`.slice(0, 90), { x: 50, y, size: 10, font });
  y -= 26;
  const rows = [
    ["No.", "Item", "Kit No.", "Qty"],
    ["1", "Serum separator tube", "LK-001", "10"],
    ["2", "EDTA whole blood tube", "LK-002", "10"],
    ["3", "Urine collection cup", "LK-003", "5"],
    ["4", "Shipping cold box", "LK-010", "1"],
    ["5", "Requisition form", "LK-DOC", "2"],
  ];
  const cols = [50, 90, 330, 470];
  for (let ri = 0; ri < rows.length; ri++) {
    const f = ri === 0 ? bold : font;
    rows[ri].forEach((cell, ci) => page.drawText(cell, { x: cols[ci], y, size: 10, font: f }));
    y -= 18;
  }
  return await doc.save();
}

export interface SubmissionPackage {
  pdfBytes: Uint8Array;
  xml: string;
  pageCount: number;
  packingListsIncluded: number;
}

export interface OutputOptions {
  /**
   * 日本語フォント（TTF/OTF）の取得先。半角0.5em・全角1.0em の固定ピッチであること。
   * 既定は IPA明朝（MS明朝とメトリックが完全一致し、再配布できる）。
   * SPFx では ClientSideAssets 上の絶対URLを渡す。
   */
  fontUrl?: string;
}

let defaultFontUrl = "/fonts/ipam.ttf";

/**
 * 届書PDF のフォント取得先を差し替える。
 * SPFx ではサイトの ClientSideAssets から配信するため、Web パーツの初期化時に
 * `setDefaultFontUrl(`${cdnBasePath}/ipam.ttf`)` を呼ぶ。
 */
export function setDefaultFontUrl(url: string): void {
  defaultFontUrl = url;
}

/** フォントは数MBあるので一度読んだら使い回す */
let fontCache: { url: string; bytes: Uint8Array } | undefined;

async function loadFont(url: string): Promise<Uint8Array> {
  if (fontCache?.url === url) return fontCache.bytes;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`届書PDFのフォントを取得できませんでした（${url} → HTTP ${res.status}）`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  fontCache = { url, bytes };
  return bytes;
}

export async function generateSubmissionPackage(
  n: Notification,
  ctx: XmlContext,
  opts: OutputOptions = {}
): Promise<SubmissionPackage> {
  const xml = generateCtnXml(n, ctx);

  // 届書ツリーは PDF と XML の単一ソース。ここで PDF 側を描く
  const form = buildFormDocument(n, ctx);
  const fontBytes = await loadFont(opts.fontUrl ?? defaultFontUrl);
  const pdf = await renderFormPdf(form, { fontBytes });

  // 検査キット/パッキングリストの実ファイルを結合（デモはサンプル）
  const packingLists = n.attachments.filter((a) => a.docType === DOC_TYPE.packingList);
  for (const pl of packingLists) {
    const src = await PDFDocument.load(await makeSamplePackingList(pl.docName || "Lab Kit Packing List"));
    const copied = await pdf.copyPages(src, src.getPageIndices());
    copied.forEach((p) => pdf.addPage(p));
  }

  const pdfBytes = await pdf.save();
  return { pdfBytes, xml, pageCount: pdf.getPageCount(), packingListsIncluded: packingLists.length };
}

export function downloadBlob(data: Uint8Array | string, filename: string, mime: string) {
  const blob = new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
