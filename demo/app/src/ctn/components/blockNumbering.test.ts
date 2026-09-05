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
import { XSD_ENTRIES, xsdLabel, xsdNo } from "../xsdLabels";

/** セクションの開始位置。番号を持つものと持たないものの両方を拾う */
const SECTION_RE = /<Section\s/g;
// el={gb("主","従")} や el={cond ? "A" : "B"} のように式で書いたものも拾う
const BLOCK_RE = /<FormBlock\s+el=(?:"([A-Z0-9_]+)"|\{([^}]*)\})|xsdNo\("([A-Z0-9_]+)"\)/g;

interface Hit {
  at: number;
  els: string[];
}
const collect = (re: RegExp): Hit[] => {
  const out: Hit[] = [];
  for (const m of src.matchAll(re)) {
    const els: string[] = [];
    for (const [i, g] of m.slice(1).entries()) {
      if (!g) continue;
      // el={...} の式は中の要素名をすべて取り出す（それ以外はそのまま要素名）
      if (i === 1) els.push(...[...g.matchAll(/"([A-Z0-9_]+)"/g)].map((x) => x[1]));
      else els.push(g);
    }
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

// ---------------------------------------------------------------------------
// ブロックの入れ子
// ---------------------------------------------------------------------------
// 届書で親子のブロックは、画面でも親の中に入れる。横並びにすると入れ子が1段
// 浅く見え、ブロックに属さない単独の欄（主たる被験薬の製造方法など）が直前の
// ブロックの続きに見える（クライアント指摘 2026-09-05）。

/** ソースを走査して、各 FormBlock の「画面上の親ブロック」を求める */
function screenParents(): { el: string; at: number; parents: string[] }[] {
  const out: { el: string; at: number; parents: string[] }[] = [];
  const stack: { els: string[] }[] = [];
  // <FormBlock … > / <FormBlock … /> / </FormBlock> を出現順に見る
  const TAG = /<FormBlock\b|<\/FormBlock>/g;
  for (const m of src.matchAll(TAG)) {
    if (m[0] === "</FormBlock>") {
      stack.pop();
      continue;
    }
    // このタグの終わりを探し、自己終了かどうかと el を読む。
    // 属性の中にアロー関数（=>）や自己終了タグ（<Badge />）が入るので、
    // 最初の ">" で切ってはいけない。波かっこと引用符の外の ">" を探す。
    let depth = 0;
    let quote = "";
    let end = m.index!;
    for (let i = m.index!; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === quote) quote = "";
        continue;
      }
      if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    const tag = src.slice(m.index!, end + 1);
    const selfClosing = tag.trimEnd().endsWith("/>");
    const elAttr = /el=(?:"([A-Z0-9_]+)"|\{([^}]*)\})/.exec(tag);
    const els = elAttr
      ? elAttr[1]
        ? [elAttr[1]]
        : [...elAttr[2].matchAll(/"([A-Z0-9_]+)"/g)].map((x) => x[1])
      : [];
    const parents = stack.flatMap((f) => f.els);
    for (const el of els) out.push({ el, at: m.index!, parents });
    if (!selfClosing) stack.push({ els });
  }
  return out;
}

describe("ブロックの入れ子が届書と一致する", () => {
  const found = screenParents();
  /** 画面に出ているブロック（同じタブに出ているかを見るため位置つき） */
  const rendered = new Set(found.map((f) => f.el));

  it("走査できている（FormBlock を1つも拾えていない、ということがない）", () => {
    expect(found.length).toBeGreaterThan(20);
  });

  for (const f of found) {
    const entry = XSD_ENTRIES.find((e) => e.el === f.el && e.no);
    const parentEl = entry?.parentEl;
    if (!parentEl || !rendered.has(parentEl)) continue; // 親を画面に出していないならこの検査の対象外
    it(`「${xsdNo(f.el)} ${xsdLabel(f.el)}」は「${xsdNo(parentEl)} ${xsdLabel(parentEl)}」の中にある`, () => {
      expect(
        f.parents.includes(parentEl),
        `届書では ${xsdNo(f.el)} は ${xsdNo(parentEl)} の中。画面でも中に入れること` +
          `（いまの親: ${f.parents.join(" > ") || "なし"}）`
      ).toBe(true);
    });
  }
});
