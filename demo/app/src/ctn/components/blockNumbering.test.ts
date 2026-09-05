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
// ファイル末尾のセクションに引きずられる。カードが「使われている場所」の
// セクションを、そのカード全体のセクションとして扱う。
//
// 薬カードは2つのタブで使う（主たる被験薬＝届書2 と その他治験使用薬＝届書3）。
// カードの中のブロックは gb() で主従を切り替えるので、どちらか一方の下にあれば
// よい（両方を同時に満たすことはありえない）。
const iDrugCard = src.indexOf("function StudyDrugCard(");
const iSiteCard = src.indexOf("function SiteCard(");

const lastSectionBefore = (pos: number): string | undefined => {
  let cur: { at: number; el?: string } | undefined;
  for (const s of sections) if (s.at < pos) cur = s;
  return cur?.el;
};

/** 部品が使われているすべての場所のセクション */
const sectionsWhereUsed = (tag: string): (string | undefined)[] => {
  const out: (string | undefined)[] = [];
  let i = src.indexOf(tag);
  while (i !== -1 && i < iDrugCard) {
    out.push(lastSectionBefore(i));
    i = src.indexOf(tag, i + 1);
  }
  return out.length ? out : [undefined];
};

/** その位置を含むかたまりのセクション（複数ありうる） */
const sectionsAt = (pos: number): (string | undefined)[] => {
  if (pos >= iSiteCard) return sectionsWhereUsed("<SiteCard");
  if (pos >= iDrugCard) return sectionsWhereUsed("<StudyDrugCard");
  return [lastSectionBefore(pos)];
};

describe("画面のブロック番号が届書の入れ子と矛盾しない", () => {
  it("検査対象が取れている（正規表現が空振りしていない）", () => {
    expect(sections.length).toBeGreaterThan(5);
    expect(sections.filter((s) => s.el).length).toBeGreaterThan(3);
    expect(blocks.length).toBeGreaterThan(15);
  });

  const under = (no: string, sectionNo: string) => no === sectionNo || no.startsWith(`${sectionNo}.`);

  for (const b of blocks) {
    const sectionEls = sectionsAt(b.at);
    // 番号を付けていないセクションが1つでもあれば、そこには何を入れてもよい
    if (sectionEls.some((x) => !x || !xsdNo(x))) continue;
    const sectionNos = sectionEls.map((x) => xsdNo(x!));
    const where = sectionNos.join(" / ");

    for (const el of b.els) {
      const no = xsdNo(el);
      if (!no) continue;
      it(`「${where}」の中の「${no} ${xsdLabel(el)}」`, () => {
        expect(
          sectionNos.some((sn) => under(no, sn)),
          `届書では ${no} は ${where} のどれの下でもない。` +
            `セクションの番号を外すか、ブロックを別のセクションへ移すこと。`
        ).toBe(true);
      });
    }
  }
});

describe("タブが届書の連続した番号の範囲になっている", () => {
  it("薬のタブは主たる被験薬（届書2）とその他（届書3）で分かれている", () => {
    // 以前はどちらも1つのタブにあり、タブに片方の番号を付けたため
    // 「3 の中に 2.2 がある」という入れ子の矛盾になっていた。
    const main = src.slice(src.indexOf('activeTab === "maindrug"'), src.indexOf('activeTab === "plan"'));
    const others = src.slice(src.indexOf('activeTab === "drugs"'), src.indexOf('activeTab === "sites"'));
    expect(main).toContain('<Section title={xsdTitle("INFONOTE")}');
    expect(main).toContain("mainDrug");
    expect(others).toContain('<Section title={xsdTitle("INFOCOMBINATION")}');
    expect(others).toContain("otherDrugs");
  });

  it("タブの並びが届書の番号の順になっている", () => {
    const conf = src.slice(src.indexOf("const detailTabs"), src.indexOf("const visibleTabs"));
    const nos = [...conf.matchAll(/no: "([^"]+)"/g)].map((m) => m[1]);
    expect(nos.length).toBeGreaterThan(5);
    // 範囲の先頭の番号だけを取り出し、数値の並びとして昇順であることを見る
    const head = nos.map((n) => n.split("–")[0].split(".").map(Number));
    for (let i = 1; i < head.length; i++) {
      const a = head[i - 1];
      const b = head[i];
      const cmp = (() => {
        for (let k = 0; k < Math.max(a.length, b.length); k++) {
          const d = (a[k] ?? 0) - (b[k] ?? 0);
          if (d !== 0) return d;
        }
        return 0;
      })();
      expect(cmp, `タブの並びが届書の順ではない: ${nos[i - 1]} → ${nos[i]}`).toBeLessThan(0);
    }
  });
});
