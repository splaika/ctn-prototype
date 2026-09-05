// ============================================================================
// 画面のブロック番号の入れ子が届書と矛盾しないことの検査
// ----------------------------------------------------------------------------
// 画面のセクション（タブの中の大きな枠）とブロックには届書の見出し番号を出して
// いる。セクションに番号を付けたなら、その中に出るブロックは届書でもその下に
// なければならない。
//
// 実際にこれを破っていた: 治験使用薬タブのセクションに「3 治験使用薬…の情報」を
// 付けていたが、主たる被験薬の薬の明細は届書では「2 主たる被験薬に関する届出事項」
// の中なので、3 の枠の中に 2.2 / 2.3 / 2.5 が並ぶ状態になっていた
// （クライアント指摘 2026-09-05）。
//
// 画面のソースを読んで検査する。宣言を別に持つと画面とずれるため。
// ============================================================================
import { describe, expect, it } from "vitest";
// 画面のソースをそのまま読む（?raw は Vite が中身を文字列で渡す）。
// node:fs を使うとブラウザ向けの tsconfig に @types/node が要るので避ける。
import src from "./NotificationDetail.tsx?raw";
import { xsdLabel, xsdNo } from "../xsdLabels";

/** セクションの開始位置。番号を持つものと持たないものの両方を拾う */
const SECTION_RE = /<Section\s/g;
const BLOCK_RE =
  /<FormBlock\s+el=(?:"([A-Z0-9_]+)"|\{gb\("([A-Z0-9_]+)",\s*"([A-Z0-9_]+)"\)\})|xsdNo\("([A-Z0-9_]+)"\)/g;

interface Hit {
  at: number;
  els: string[];
}
const collect = (re: RegExp): Hit[] => {
  const out: Hit[] = [];
  for (const m of src.matchAll(re)) {
    const els = m.slice(1).filter((x): x is string => Boolean(x));
    if (els.length) out.push({ at: m.index!, els });
  }
  return out;
};

// セクションは「番号なし」もあるので、開始位置を全部拾ってから番号の有無を見る。
// 番号なしのセクションを飛ばすと、その前の番号つきセクションが後ろまで効いてしまう。
const sections = [...src.matchAll(SECTION_RE)].map((m) => {
  const head = src.slice(m.index!, m.index! + 200);
  const title = /title=\{xsdTitle\("([A-Z0-9_]+)"\)\}/.exec(head);
  return { at: m.index!, el: title?.[1] };
});
const blocks = collect(BLOCK_RE);

// 薬カード・施設カードは別の関数なので、本体の位置だけでセクションを決めると
// ファイル末尾のセクションに引きずられる。カードが使われている場所の
// セクションをそのカード全体のセクションとして扱う。
const iDrugCard = src.indexOf("function StudyDrugCard(");
const iSiteCard = src.indexOf("function SiteCard(");

const lastSectionBefore = (pos: number): string | undefined => {
  let cur: { at: number; el?: string } | undefined;
  for (const s of sections) if (s.at < pos) cur = s;
  return cur?.el;
};

/** その位置を含むかたまりのセクション */
const sectionAt = (pos: number): string | undefined => {
  if (pos >= iSiteCard) return lastSectionBefore(src.indexOf("<SiteCard"));
  if (pos >= iDrugCard) return lastSectionBefore(src.indexOf("<StudyDrugCard"));
  return lastSectionBefore(pos);
};

describe("画面のブロック番号が届書の入れ子と矛盾しない", () => {
  it("検査対象が取れている（正規表現が空振りしていない）", () => {
    expect(sections.length).toBeGreaterThan(5);
    expect(sections.filter((s) => s.el).length).toBeGreaterThan(3);
    expect(blocks.length).toBeGreaterThan(15);
  });

  for (const b of blocks) {
    const sectionEl = sectionAt(b.at);
    if (!sectionEl) continue;
    const sectionNo = xsdNo(sectionEl);
    if (!sectionNo) continue; // 番号を付けていないセクションは何を入れてもよい

    for (const el of b.els) {
      const no = xsdNo(el);
      if (!no) continue;
      it(`「${sectionNo} ${xsdLabel(sectionEl)}」の中の「${no} ${xsdLabel(el)}」`, () => {
        expect(
          no === sectionNo || no.startsWith(`${sectionNo}.`),
          `届書では ${no} は ${sectionNo} の下ではない。` +
            `セクションの番号を外すか、ブロックを別のセクションへ移すこと。`
        ).toBe(true);
      });
    }
  }
});

describe("届書の2ブロックにまたがるタブは番号を持たない", () => {
  it("治験使用薬タブのセクションは番号なしで、中に 2 と 3 の見出しが出る", () => {
    // 主たる被験薬の薬の明細は 2、それ以外は 3。片方の番号をタブ全体に
    // 付けると入れ子が矛盾する（この検査の元になった不具合）。
    const tab = src.slice(src.indexOf('activeTab === "drugs"'), src.indexOf('activeTab === "sites"'));
    expect(tab).toContain('<Section title={t("Study drugs", "治験使用薬")}');
    expect(tab).not.toMatch(/<Section title=\{xsdTitle\(/);
    expect(tab).toContain('<FormBlock el="INFONOTE"');
    expect(tab).toContain('<FormBlock el="INFOCOMBINATION"');
  });
});
