// ============================================================================
// 提出パッケージ出力（PDF＋XML）— クライアント生成（デモ）
// ----------------------------------------------------------------------------
// ① CTN XML（generateCtnXml）
// ② 届書PDF：印刷ビューを html2canvas でラスタライズ → pdf-lib でページ化
// ③ 添付「検査キット/パッキングリスト」があれば、実PDFを②に結合して1ファイル化
//    （デモは実ファイルが無いためサンプルPDFを生成。本番は SharePoint/Dataverse の実体）
// ※ 本番はサーバー側生成（テキスト選択可・実ファイル結合）が堅牢。本モジュールはUXプロト。
// ============================================================================
import html2canvas from "html2canvas";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateCtnXml, type XmlContext } from "./xml";
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

export async function generateSubmissionPackage(
  printableEl: HTMLElement,
  n: Notification,
  ctx: XmlContext
): Promise<SubmissionPackage> {
  const xml = generateCtnXml(n, ctx);

  const canvas = await html2canvas(printableEl, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
  const pdf = await PDFDocument.create();
  const png = await pdf.embedPng(dataUrlToBytes(canvas.toDataURL("image/png")));
  const scaledH = (canvas.height * A4.w) / canvas.width; // ページ幅に合わせた全体高
  const pages = Math.max(1, Math.ceil(scaledH / A4.h));
  for (let i = 0; i < pages; i++) {
    const page = pdf.addPage([A4.w, A4.h]);
    // 画像全体を各ページに描き、下方向にずらしてスライス表示（ページ境界でクリップ）
    page.drawImage(png, { x: 0, y: A4.h - scaledH + i * A4.h, width: A4.w, height: scaledH });
  }

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
