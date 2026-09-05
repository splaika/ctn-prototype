// ============================================================================
// gen-block-map.mjs — 画面のブロック番号と届書の対応表をつくる
// ----------------------------------------------------------------------------
// 入力画面のブロックには届書（公式XSD）の見出し番号を出している（FormBlock）。
// その番号が届書PDF のどこに当たるのかを突き合わせるための資料を2つ作る:
//
//   docs/画面ブロックと届書の対応.md   … 番号・項目名・届書の階層・画面のタブ
//   docs/届書PDF_ブロック番号つき.pdf  … 左余白に番号を刷った届書PDF
//
// 番号の振り方は xsdLabels.ts が唯一の実装で、ここは写し直さない
// （scripts/blockmap-entry.ts でアプリのコードをそのまま呼ぶ）。
// 画面のどのタブに出るかは NotificationDetail.tsx を読んで拾う（宣言を増やすと
// 画面と表がずれるため、画面のソースを正とする）。
//
//   npm run blockmap
// ============================================================================
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, "..");
const DOCS = join(APP, "docs");
const FONT = resolve(APP, "../../ctn-spfx/assets/ipam.ttf");

if (!existsSync(FONT)) {
  console.error(`フォントが見つかりません: ${FONT}`);
  process.exit(1);
}
mkdirSync(DOCS, { recursive: true });

// --- アプリのコードを束ねて実行し、ブロック一覧とPDFを得る -------------------
const work = mkdtempSync(join(tmpdir(), "ctn-blockmap-"));
const bundle = join(work, "entry.mjs");
const esbuild = join(APP, "node_modules", "esbuild", "bin", "esbuild");
execFileSync(
  process.execPath,
  [esbuild, join(HERE, "blockmap-entry.ts"), "--bundle", "--platform=node", "--format=esm", "--external:node:*", `--outfile=${bundle}`, "--log-level=error"],
  { cwd: APP, stdio: ["ignore", "inherit", "inherit"] }
);
const jsonPath = join(work, "blocks.json");
const pdfPath = join(DOCS, "届書PDF_ブロック番号つき.pdf");
execFileSync(process.execPath, [bundle, jsonPath, pdfPath, FONT], { stdio: ["ignore", "inherit", "inherit"] });
const { blocks, fields } = JSON.parse(readFileSync(jsonPath, "utf8"));

// --- 画面のどのタブ・どの部品に出るかを NotificationDetail.tsx から拾う -----
// タブは届書の連続した番号の範囲。並び順もこのとおり
const TAB_LABEL = {
  basic: "1–2.1 届出事項",
  maindrug: "2.2–2.5 主たる被験薬",
  plan: "2.6–2.8 治験計画の概要",
  notes: "2.9–2.12 備考・添付・届出者",
  drugs: "3 その他治験使用薬",
  sites: "4 実施医療機関",
  refs: "5 参照・照会",
};
const src = readFileSync(join(APP, "src", "ctn", "components", "NotificationDetail.tsx"), "utf8");

/** el → 画面の場所（複数箇所に出ることがあるので配列） */
const screen = new Map();
const put = (el, where) => {
  const list = screen.get(el) ?? [];
  if (!list.includes(where)) list.push(where);
  screen.set(el, list);
};

// 部品ごとに区切る。
// 薬カードは2つのタブで使う（主たる被験薬＝届書2 と その他治験使用薬＝届書3）。
// カードの中では gb(主, 従) で出力先を切り替えているので、第1引数は主たる被験薬の
// タブ、第2引数はその他治験使用薬のタブに割り当てる。gb を使っていない要素は
// すべて従（COMB_ 側）なので その他治験使用薬のタブ。
const iDrug = src.indexOf("function StudyDrugCard(");
const iSite = src.indexOf("function SiteCard(");
const regions = [
  { text: src.slice(0, iDrug), tab: null }, // タブは本文中の activeTab で切り替える
  { text: src.slice(iDrug, iSite), tab: "drugs", gbTabs: ["maindrug", "drugs"] },
  { text: src.slice(iSite), tab: "sites" },
];

// 画面がブロックの見出しを出している書き方をすべて拾う:
//   <FormBlock el="X" ...>        … ふつうのブロック
//   <FormBlock el={gb("A","B")}>  … 主たる被験薬／その他治験使用薬で出力先が変わるもの
//   <Section title={xsdTitle("X")}> … タブ直下の大きな枠
//   xsdNo("X") / xsdLabel("X")    … 表など FormBlock を使えない場所で直接出しているもの
const BLOCK_RE = /<FormBlock\s+el=(?:"([A-Z0-9_]+)"|\{gb\("([A-Z0-9_]+)",\s*"([A-Z0-9_]+)"\)\})|xsdTitle\("([A-Z0-9_]+)"\)|xsdNo\("([A-Z0-9_]+)"\)|xsdLabel\("([A-Z0-9_]+)"\)/g;
const TAB_RE = /activeTab === "(\w+)"/g;

for (const region of regions) {
  // 本文側は activeTab の出現位置でタブを切り替える
  const tabs = [];
  if (region.tab === null) {
    for (const m of region.text.matchAll(TAB_RE)) tabs.push({ at: m.index, tab: m[1] });
  }
  const tabAt = (pos) => {
    if (region.tab) return region.tab;
    let cur = null;
    for (const t of tabs) if (t.at <= pos) cur = t.tab;
    return cur;
  };
  for (const m of region.text.matchAll(BLOCK_RE)) {
    const tab = tabAt(m.index);
    if (!tab) continue;
    const label = (k) => TAB_LABEL[k] ?? k;
    // gb("主", "従") のときだけ引数ごとに行き先タブが違う
    if (region.gbTabs && m[2] && m[3]) {
      put(m[2], label(region.gbTabs[0]));
      put(m[3], label(region.gbTabs[1]));
      continue;
    }
    for (const el of m.slice(1)) if (el) put(el, label(tab));
  }
}

// --- 対比表を書き出す -------------------------------------------------------
// 繰り返し枠は行の数だけ同じ欄名が並ぶので、出現順のまま重複を落とす
const fieldsByBlock = new Map();
for (const f of fields) {
  const list = fieldsByBlock.get(f.block) ?? [];
  if (!list.includes(f.label)) list.push(f.label);
  fieldsByBlock.set(f.block, list);
}

const rows = blocks.map((b) => {
  const where = screen.get(b.el) ?? [];
  const parents = b.path.slice(0, -1).join(" › ");
  const items = fieldsByBlock.get(b.no) ?? [];
  return { ...b, where, parents, items };
});

const esc = (s) => s.replace(/\|/g, "\\|");
const md = [];
md.push("# 画面のブロック番号と届書の対応");
md.push("");
md.push("入力画面のブロックに出ている紫のラベル（`2.6.1` 等）が、届書のどの位置に");
md.push("当たるかの一覧。**この番号は公式のものではなく、画面と届書を突き合わせる**");
md.push("**ためにこのアプリが振っているもの**で、届書には印字されない。");
md.push("");
md.push("## 番号の振り方");
md.push("");
md.push("- 公式XSD（`iykckn_all_v3_0_0`）のツリーをそのまま辿り、**入れ物の要素にだけ**");
md.push("  上から順に番号を振る（`xsdLabels.ts`）。値だけの欄には番号がつかない。");
md.push("- 番号は**届書の並び順**で、画面の並び順ではない。画面はタブに分かれているので、");
md.push("  1つのタブの中では番号が飛ぶ（例：基本情報タブには 2.9 / 2.11 / 2.12 が出るが、");
md.push("  2.1〜2.8 は治験計画概要タブと治験使用薬タブにある）。");
md.push("- 「繰り返し」は届書がその枠を繰り返せることを示す（XSD の `maxOccurs=\"unbounded\"`）。");
md.push("");
md.push(`- ブロック数: **${blocks.length}**`);
md.push(`- 生成: \`npm run blockmap\`（このファイルと \`届書PDF_ブロック番号つき.pdf\` を作る）`);
md.push("");
md.push("## 一覧");
md.push("");
md.push("| 番号 | 届書の項目名 | 届書での位置（親の階層） | 画面 | 繰返 | この枠の中の欄 |");
md.push("| --- | --- | --- | --- | --- | --- |");
for (const r of rows) {
  md.push(
    `| \`${r.no}\` | ${esc(r.label)} | ${esc(r.parents) || "—"} | ${r.where.join(" / ") || "—"} | ${r.repeat ? "○" : ""} | ${esc(r.items.join("、")) || "—"} |`
  );
}
md.push("");
md.push("## 画面に番号を出していないブロック");
md.push("");
const missing = rows.filter((r) => r.where.length === 0);
if (missing.length === 0) {
  md.push("なし（すべてのブロックが画面のどこかに番号つきで出ている）。");
} else {
  md.push("中の欄は画面に出ているが、ブロックの見出し（番号）としては出していないもの。");
  md.push("入れ物だけで、中の欄が1つのまとまりとして画面に並んでいる場合。");
  md.push("");
  for (const r of missing) md.push(`- \`${r.no}\` ${r.label}（${r.parents}）`);
}
md.push("");

const mdPath = join(DOCS, "画面ブロックと届書の対応.md");
writeFileSync(mdPath, md.join("\n"), "utf8");
console.log(`生成: ${mdPath}`);
console.log(`生成: ${pdfPath}`);
console.log(`画面に出ていないブロック: ${missing.length} 件`);
