// ============================================================================
// xsdLabels.ts — 公式XSDの項目名・階層・並び順を引くための索引
// ----------------------------------------------------------------------------
// 画面ラベル・届書PDF・XML はすべて xsdForm.generated.ts（厚生労働省の
// iykckn_all_v3_0_0.xsd から生成）を正とする。ここはその引き方を1か所に集める。
//
// なぜ索引が必要か:
//   以前は「入力欄 → 届書のどの項目か」を officialLabels.ts に手で書いていた。
//   宣言なので実際のXSDとずれても気づけず、16欄が公式名になっていなかった。
//   要素名だけを宣言して項目名と階層はXSDから引く形にすれば、ずれようがない。
//
// 【要素名だけでは決まらないもの】
//   APPLICABLEORNOT / CONTENTS / DETAIL / SERIALNO1 などは、XSD上の複数の位置で
//   別の項目名を持つ（「該当の有無」と「該当の有無等」など）。そのため索引の
//   キーは「要素名」と「要素名＠親要素名」の2通りを持ち、曖昧なものは親を添えて
//   引く。親を省いて曖昧な要素を引いた場合は最初の出現を返す。
// ============================================================================
import { XSD_FORM, walkXsd, type XsdNode } from "./xsdForm.generated";

/**
 * XSDがコメント（項目名）を持たない入れ物要素の表示名。
 * インライン complexType の9要素だけXSDに記載が無いため、実際の届書出力
 * （AMG 410 第1回・13ページ）に印字されている名称を使う。XSD側に記載が無い
 * というだけで、公式出力に出ている名称が正である。
 */
export const GROUP_LABEL_FROM_OUTPUT: Record<string, string> = {
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

export interface XsdEntry {
  el: string;
  /** 直上の要素名（最上位は undefined） */
  parentEl?: string;
  /** 公式様式の項目名 */
  label: string;
  /** 届書の階層。末尾が label */
  path: string[];
  /** 届書の見出し番号（入れ物要素にだけ振る。例 "3.9.1"） */
  no?: string;
  kind: "value" | "group";
  repeat?: boolean;
}

const entries: XsdEntry[] = [];
/** 要素名 → 出現順のエントリ列 */
const byEl = new Map<string, XsdEntry[]>();
/** "要素名@親要素名" → エントリ */
const byElParent = new Map<string, XsdEntry>();

// 届書の見出し番号。入れ物要素だけを対象に階層番号を振る。
// 届書PDF は項目を上から順に並べた形なので、番号があると
// 「画面のこのブロックが届書のどこか」を目で追える。
const groupCounter = new Map<string, number>();
const numberFor = (parentNo: string): string => {
  const next = (groupCounter.get(parentNo) ?? 0) + 1;
  groupCounter.set(parentNo, next);
  return parentNo ? `${parentNo}.${next}` : String(next);
};
const noByNode = new Map<XsdNode, string>();

walkXsd(XSD_FORM, (node, ancestors) => {
  const parent = ancestors[ancestors.length - 1];
  const entry: XsdEntry = {
    el: node.el,
    parentEl: parent?.el,
    label: labelOf(node),
    path: [...ancestors.map(labelOf), labelOf(node)],
    kind: node.kind,
    ...(node.repeat ? { repeat: true } : {}),
  };
  if (node.kind === "group") {
    const no = numberFor(parent ? (noByNode.get(parent) ?? "") : "");
    noByNode.set(node, no);
    entry.no = no;
  }
  entries.push(entry);
  const list = byEl.get(node.el) ?? [];
  list.push(entry);
  byEl.set(node.el, list);
  const key = `${node.el}@${parent?.el ?? ""}`;
  if (!byElParent.has(key)) byElParent.set(key, entry);
});

export const XSD_ENTRIES: readonly XsdEntry[] = entries;

/**
 * 要素の索引を引く。同じ要素名が複数箇所にある場合は親要素名で特定する。
 * 見つからないときは undefined（呼び出し側でフォールバックする）。
 */
export function xsdEntry(el: string, parentEl?: string): XsdEntry | undefined {
  if (parentEl) {
    const hit = byElParent.get(`${el}@${parentEl}`);
    if (hit) return hit;
  }
  return byEl.get(el)?.[0];
}

/** 要素名が複数箇所に現れるか（親要素名の指定が必要か） */
export const isAmbiguous = (el: string): boolean => (byEl.get(el)?.length ?? 0) > 1;

/** 公式様式の項目名 */
export const xsdLabel = (el: string, parentEl?: string): string =>
  xsdEntry(el, parentEl)?.label ?? el;

/** 届書の階層（末尾が項目名） */
export const xsdPath = (el: string, parentEl?: string): string[] =>
  xsdEntry(el, parentEl)?.path ?? [el];

/** 届書の見出し番号（入れ物要素のみ。値要素は親の番号） */
export const xsdNo = (el: string, parentEl?: string): string =>
  xsdEntry(el, parentEl)?.no ?? "";

/**
 * 画面のセクション見出し用。「番号 + 公式の項目名」を返す。
 * 届書PDF は項目を上から順に並べた形なので、番号を出すと画面のかたまりと
 * 届書の位置が対応する。項目名は法令上の名称なので言語で変えない。
 */
export function xsdTitle(el: string, parentEl?: string): string {
  const e = xsdEntry(el, parentEl);
  if (!e) return el;
  return e.no ? `${e.no} ${e.label}` : e.label;
}
