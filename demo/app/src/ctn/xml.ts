// ============================================================================
// CTN XML 生成 — 公式XSD（iykckn_all_v3_0_0.xsd）準拠
// ----------------------------------------------------------------------------
// 以前はデモ用サブセットを出していた（要素名の一致は138のうち55、ルート要素名も
// 独自、VARIABLELABEL は未実装）。厚生労働省のXSDがリポジトリ内にあることが
// 分かったので、それを単一ソースにして作り直した。
//
//   xsdForm.generated.ts … XSD から生成した構造・項目名・出現順・STATUS種別
//   formValues.ts        … 要素名 → 値
//   formTree.ts          … 上2つを合わせた届書ツリー
//   このファイル          … 届書ツリー → 公式XML
//
// 出力の形（公式サンプル sample-CLINTRIALPLANNOTE.xml と同じ）:
//   <CLINTRIALPLANNOTE xsd:noNamespaceSchemaLocation="iykckn_all_v3_0_0.xsd">
//     <VARIABLELABEL>治験の計画等の届出</VARIABLELABEL>
//     <INFOFORMVERSION STATUS="NONE">
//       <VARIABLELABEL>様式等のバージョン情報</VARIABLELABEL>医薬品治験届 …
//     </INFOFORMVERSION>
//
// 値要素は mixed content。VARIABLELABEL（項目名）を先に置き、その後ろに値を
// テキストで書く。入れ物要素も先頭に VARIABLELABEL を持つ。
//
// STATUS は現状すべて NONE を出す。変更追跡（UPDATE/APPEND/DELETE と
// CHANGEDATE/CHANGEREASON）は変更届の実装時に入れる。XSD 上は NONE が
// 全種別で許容されるため、これでも検証は通る。
// ============================================================================
import { buildFormDocument, walkForm, type FormContext, type FormNode } from "./formTree";
import { XSD_BY_ELEMENT, XSD_ROOT } from "./xsdForm.generated";
import { DRUG_ROLE } from "./refData";
import type { Notification } from "./types";

/** 呼び出し側の型は従来どおり（FormContext と同じ形） */
export type XmlContext = FormContext;

const esc = (s: string | number | undefined): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 値要素に付ける STATUS。型ごとに取りうる値は違うが NONE は全型で許される */
const statusAttr = (el: string): string => {
  const node = XSD_BY_ELEMENT[el];
  return node?.kind === "value" && node.status ? ' STATUS="NONE"' : "";
};

const PAD = "  ";

function emit(node: FormNode, depth: number, out: string[]): void {
  const pad = PAD.repeat(depth);
  const labelEl = `<VARIABLELABEL>${esc(node.label)}</VARIABLELABEL>`;

  if (!node.children) {
    // 値要素。mixed content なので VARIABLELABEL の後ろに値を置く
    const value = esc(node.xmlValue ?? node.value ?? "");
    out.push(`${pad}<${node.el}${statusAttr(node.el)}>${labelEl}${value}</${node.el}>`);
    return;
  }
  out.push(`${pad}<${node.el}>`);
  out.push(`${pad}${PAD}${labelEl}`);
  for (const child of node.children) emit(child, depth + 1, out);
  out.push(`${pad}</${node.el}>`);
}

export function generateCtnXml(n: Notification, ctx: XmlContext): string {
  const form = buildFormDocument(n, ctx);
  const out: string[] = [];
  out.push('<?xml version="1.0" encoding="utf-8"?>');
  out.push(
    `<${XSD_ROOT} xmlns:xsd="http://www.w3.org/2001/XMLSchema-instance"` +
      ` xsd:noNamespaceSchemaLocation="iykckn_all_v3_0_0.xsd">`
  );
  out.push(`${PAD}<VARIABLELABEL>治験の計画等の届出</VARIABLELABEL>`);
  // 先頭の「治験の計画等の届出」はルート要素そのものの見出しなので子には出さない
  for (const node of form.body) {
    if (node.el === XSD_ROOT) continue;
    emit(node, 1, out);
  }
  out.push(`</${XSD_ROOT}>`);
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// 妥当性チェック（業務ロジック側）
// ---------------------------------------------------------------------------
// XSD は構造・出現順・STATUS値・必須を見るが、桁やコード値、業務ルールは見ない。
// ここは業務ルール側の検査。XSD 検証は archive の validate_ctn_xml.py が担う。
export interface XsdCheck {
  ok: boolean;
  errors: string[];
  warnings: string[];
  elementCount: number;
}

export function validateAgainstSubset(n: Notification, xml: string): XsdCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isTerminal = n.notifType === "termination" || n.notifType === "completion";
  const needsPlanFields = n.notifType === "plan" || n.notifType === "change";

  // 開発中止届は治験使用薬・実施医療機関ともに対象外（requiredByType「―」）
  if (n.notifType !== "devDiscontinuation" && !n.studyDrugs.some((d) => d.drugRole === DRUG_ROLE.main))
    errors.push("主たる被験薬が1行必要です（1届1行）。");
  if (n.studyDrugs.filter((d) => d.drugRole === DRUG_ROLE.main).length > 1)
    errors.push("主たる被験薬は1行のみ許可されます。");
  if (n.notifType !== "devDiscontinuation" && n.sites.length === 0)
    errors.push("実施医療機関が1件以上必要です。");
  if (!n.sponsorId) errors.push("治験届出者が未設定です。");
  if (needsPlanFields && !n.protocolNo) warnings.push("実施計画書識別記号が未入力です。");
  if (isTerminal)
    for (const s of n.sites)
      for (const q of s.quantities)
        if (q.qtySupplied == null) {
          warnings.push("終了/中止届では交付〜廃棄の数量入力が必要です。");
          break;
        }

  const elementCount = (xml.match(/<[A-Z]/g) ?? []).length;
  return { ok: errors.length === 0, errors, warnings, elementCount };
}

// ---------------------------------------------------------------------------
// 届書PDF と XML の突合
// ---------------------------------------------------------------------------
// 両者は同じ届書ツリーから出るので値の欠落は起きない。ここでは「XMLの要素名が
// 公式のまま出ているか」「PDFに出た値がXMLにもあるか」を機械的に確認する。
export interface FormXmlCoverage {
  ok: boolean;
  /** 値を持つ項目の総数 */
  total: number;
  /** XML に見つかった数 */
  covered: number;
  /** XML に無い項目（「項目名 = 値」の形） */
  missing: string[];
  /** 公式XSDに無い要素名。0 でなければ実装が独自名を出している */
  unknownElements: string[];
}

export function checkXmlCoversForm(n: Notification, ctx: XmlContext): FormXmlCoverage {
  const form = buildFormDocument(n, ctx);
  const xml = generateCtnXml(n, ctx);
  const missing: string[] = [];
  const unknown = new Set<string>();
  let total = 0;
  let covered = 0;

  walkForm(form.body, (node) => {
    if (node.el !== XSD_ROOT && !XSD_BY_ELEMENT[node.el]) unknown.add(node.el);
    const v = node.xmlValue ?? node.value;
    // 順序番号は行ごとに変わるため個別照合はしない
    if (!v || node.el === "SERIALNO1" || node.el === "SERIALNO2") return;
    total++;
    if (xml.includes(esc(v))) covered++;
    else missing.push(`${node.label} = ${v}`);
  });

  return {
    ok: missing.length === 0 && unknown.size === 0,
    total,
    covered,
    missing,
    unknownElements: [...unknown],
  };
}
