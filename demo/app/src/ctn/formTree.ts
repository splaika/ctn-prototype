// ============================================================================
// 届書ツリー — 公式XSDの構造に値を埋めたもの。PDF と XML の単一ソース
// ----------------------------------------------------------------------------
// 構造・項目名・出現順・要素名は xsdForm.generated.ts（厚生労働省の
// iykckn_all_v3_0_0.xsd から生成）が正。ここはそれを歩いて値を埋めるだけ。
//   ・pdfForm.ts … このツリー → A4 レイアウト
//   ・xml.ts     … このツリー → CTN XML（CLINTRIALPLANNOTE）
//
// 以前は届書PDFを見ながらツリーを手で組んでいた。項目名は92%合っていたが
// XML要素名は40%しか合っておらず、ルート要素名すら違っていた。XSDを歩く形に
// 変えたことで、ラベル・要素名・出現順のズレが構造的に起きなくなった。
//
// 【重要】公式様式は値の有無にかかわらず全項目名を印字する（空欄は項目名のみ）。
// 参照出力（AMG 410 の13ページ）もそうなっている。行が0件でも1行は出す。
// ============================================================================
import { XSD_FORM, type XsdNode } from "./xsdForm.generated";
import { rowsFor, valueOfWithin, ymd, type FormContext, type RowScope } from "./formValues";
import type { Notification } from "./types";

export type { FormContext };
export { ymd };

/** 届書ツリーの1ノード。value を持たないものは見出し（項目名のみ印字） */
export interface FormNode {
  /** XSD の要素名 */
  el: string;
  /** 公式様式の項目名（VARIABLELABEL に入るものと同一） */
  label: string;
  /** 値。undefined / "" は空欄（項目名だけ印字する） */
  value?: string;
  /**
   * XML に載るときの値。届書PDF が表示名を印字する一方 XML はコード値を持つ
   * 項目（届出分類・該当の有無・試験の種類など）でだけ意味を持つ。
   */
  xmlValue?: string;
  /** 繰り返し枠に入っている行数（デバッグ・件数表示用） */
  rows?: number;
  children?: FormNode[];
}

/** 届書の先頭（XSDのツリーには入らない宛名部） */
export interface FormHeader {
  noteDate: string;
  addressee: string;
  sponsorName: string;
  sponsorRepName: string;
  sponsorAddress1: string;
  sponsorAddress2: string;
}

export interface FormDocument {
  header: FormHeader;
  body: FormNode[];
}

// ---------------------------------------------------------------------------
// 組み立て
// ---------------------------------------------------------------------------

/**
 * XSD がコメントを持たない入れ物要素の表示名。
 * インライン complexType の9要素だけXSDに項目名の記載が無いため、
 * 実際の届書出力（AMG 410 第1回・13ページ）に印字されている名称を使う。
 * XSD側に記載が無いというだけで、公式出力に出ている名称が正である。
 */
const GROUP_LABEL_FROM_OUTPUT: Record<string, string> = {
  SUMMARYPROTOCOL: "治験計画の概要",
  INFOOTHERS_PRIMARY: "主たる被験薬のその他の情報",
  INFOOTHERS_PROTOCOL: "当該届出に関するその他の情報",
  INFOPERSONASSIGNNOTE: "届出担当者の情報",
  INFOCOMBINATIONID: "治験使用薬、治験使用機器相当、治験使用製品相当の記号・名称等",
  INFOCOMBINATIONCATEGORY: "治験使用薬、治験使用機器相当、治験使用製品相当区分情報",
  COMB_INFONOTE: "治験使用薬、治験使用機器相当、治験使用製品相当（主たる被験薬を除く。）の届出事項",
  COMB_SUMMARYPROTOCOL: "治験計画の概要",
  COMB_OTHERCOMMENTS: "その他の情報",
};

/** 項目名。XSDにコメントが無い入れ物だけ公式出力の名称で補う */
export const labelOf = (node: XsdNode): string =>
  node.label || GROUP_LABEL_FROM_OUTPUT[node.el] || node.el;

function buildNodes(nodes: XsdNode[], scope: RowScope, parentEl: string): FormNode[] {
  const out: FormNode[] = [];
  for (const node of nodes) {
    if (node.kind === "value") {
      const r = valueOfWithin(parentEl, node.el, scope);
      out.push({ el: node.el, label: labelOf(node), value: r?.display, xmlValue: r?.xmlValue });
      continue;
    }
    const children = node.children ?? [];
    if (node.repeat) {
      // XSD の繰り返しは「要素が繰り返す」のではなく「要素の中で子のまとまりが
      // 繰り返す」形（内側の xsd:sequence が unbounded）。したがって枠は1つで、
      // その中に行ぶんの子を並べる。要素自体を複数出すとXSD検証で落ちる。
      // 届書PDF も見出しは1回で、その下に行が並ぶ（参照出力の11ページ）。
      const rows = rowsFor(node.el, scope);
      out.push({
        el: node.el,
        label: labelOf(node),
        rows: rows.length,
        children: rows.flatMap((rowScope) => buildNodes(children, rowScope, node.el)),
      });
    } else {
      out.push({ el: node.el, label: labelOf(node), children: buildNodes(children, scope, node.el) });
    }
  }
  return out;
}

export function buildFormDocument(n: Notification, ctx: FormContext): FormDocument {
  const scope: RowScope = { n, ctx };
  return {
    header: {
      noteDate: ymd(n.noteDate),
      addressee: "独立行政法人医薬品医療機器総合機構理事長　殿",
      sponsorName: ctx.sponsor.name,
      sponsorRepName: ctx.sponsor.repName,
      sponsorAddress1: ctx.sponsor.address1,
      sponsorAddress2: ctx.sponsor.address2,
    },
    // 届書PDF の1行目「治験の計画等の届出」はXSDのルート要素に対応する見出し。
    // XSDのツリーには現れないのでここで足す。
    body: [
      { el: "CLINTRIALPLANNOTE", label: "治験の計画等の届出" },
      ...buildNodes(XSD_FORM, scope, "CLINTRIALPLANNOTE"),
    ],
  };
}

/** ツリーを深さ優先で走査する */
export function walkForm(
  nodes: FormNode[],
  visit: (node: FormNode, depth: number) => void,
  depth = 0
): void {
  for (const node of nodes) {
    visit(node, depth);
    if (node.children) walkForm(node.children, visit, depth + 1);
  }
}
