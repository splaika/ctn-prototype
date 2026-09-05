// ============================================================================
// blockmap-entry.ts — gen-block-map.mjs が束ねて実行する入口
// ----------------------------------------------------------------------------
// アプリのコード（XSDから生成した索引・届書ツリー・PDFレンダラ）をそのまま使って
//   ・画面のブロック番号つきの届書ツリー（対比表のもと）
//   ・ブロック番号を左余白に刷った届書PDF
// を作る。番号の振り方を写し直さないために、必ずアプリ側の実装を通す。
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { XSD_ENTRIES } from "../src/ctn/xsdLabels";
import { buildFormDocument, walkForm } from "../src/ctn/formTree";
import { renderFormPdf } from "../src/ctn/pdfForm";
import { makeSeedDb } from "../src/ctn/data/seed";
import type { XmlContext } from "../src/ctn/xml";

const [outJson, outPdf, fontPath] = process.argv.slice(2);

// ---- 対比表のもと：XSD の入れ物要素（番号がつくもの）----
const blocks = XSD_ENTRIES.filter((e) => e.no).map((e) => ({
  no: e.no!,
  el: e.el,
  label: e.label,
  path: e.path,
  repeat: e.repeat === true,
}));

// ---- 届書ツリーに実際に出る値項目（どのブロックの下にあるか）----
const db = makeSeedDb();
const n = db.notifications[0];
const ctx: XmlContext = {
  compound: db.compounds.find((c) => c.id === n.compoundId)!,
  sponsor: db.sponsors.find((s) => s.id === n.sponsorId)!,
  institutions: new Map(db.institutions.map((i) => [i.id, i])),
  irbs: new Map(db.irbs.map((i) => [i.id, i])),
};
const form = buildFormDocument(n, ctx);

// 値の欄がどのブロックの下にあるかを拾う。
// 同じ要素名がXSD上の別位置にあるので（投与経路コード情報など）、
// 要素名だけで引くと別のブロックに割り当ててしまう。親要素名まで見て特定する。
const fields: { block: string; label: string }[] = [];
const stack: string[] = [];
walkForm(form.body, (node, depth) => {
  stack.length = depth;
  stack[depth] = node.el;
  if (node.children) return; // 入れ物はブロック側で数える
  const parent = stack[depth - 1];
  const grand = stack[depth - 2];
  const entry =
    XSD_ENTRIES.find((e) => e.el === parent && e.parentEl === grand && e.no) ??
    XSD_ENTRIES.find((e) => e.el === parent && e.no);
  fields.push({ block: entry?.no ?? "", label: node.label });
});

writeFileSync(outJson, JSON.stringify({ blocks, fields }, null, 2), "utf8");

// ---- ブロック番号つきPDF ----
const pdf = await renderFormPdf(form, {
  fontBytes: readFileSync(fontPath),
  blockNumbers: true,
});
writeFileSync(outPdf, await pdf.save());
console.log(`ブロック ${blocks.length} 件 / 届書の項目 ${fields.length} 件`);
