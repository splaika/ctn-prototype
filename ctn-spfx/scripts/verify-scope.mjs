// ============================================================================
// verify-scope.mjs — 生成CSSが .ctnApp スコープから漏れていないか検査する
// ----------------------------------------------------------------------------
// SharePoint ページ上に同居するため、1セレクタでも素の body/*/.app が残ると
// ページ側のスタイルを壊す。sync 後に必ず実行する（npm run verify:scope）。
// ============================================================================
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCOPE = ".ctnApp";
const GENERATED = join(ROOT, "src", "shared", "styles.generated.ts");

const ts = await readFile(GENERATED, "utf8");
const m = ts.match(/export const CTN_SCOPED_CSS: string = `([\s\S]*)`;\s*$/);
if (!m) {
  console.error(`CSS 文字列を抽出できませんでした: ${GENERATED}`);
  process.exit(1);
}
const css = m[1].replace(/\\`/g, "`").replace(/\\\$\{/g, "${").replace(/\\\\/g, "\\");

const root = postcss.parse(css);

const inKeyframes = (rule) => {
  let p = rule.parent;
  while (p) {
    if (p.type === "atrule" && /keyframes$/i.test(p.name)) return true;
    p = p.parent;
  }
  return false;
};

const leaked = new Set();
const selectors = new Set();
let total = 0;

root.walkRules((rule) => {
  if (inKeyframes(rule)) return;
  for (const sel of rule.selectors) {
    total++;
    selectors.add(sel);
    if (!sel.startsWith(SCOPE)) leaked.add(sel);
  }
});

console.log(`検査セレクタ: ${total} 件（ユニーク ${selectors.size} 件）`);

if (leaked.size > 0) {
  console.error(`\n!! ${SCOPE} スコープ外のセレクタが ${leaked.size} 件あります:`);
  for (const s of leaked) console.error("   " + s);
  process.exit(1);
}

// 代表的な変換が意図どおりかを固定で確認する（回帰検知）
const EXPECTED = [
  `${SCOPE}`, // :root と body の統合先
  `${SCOPE} *`, // 全称リセット
  `${SCOPE} .app`, // アプリのルート要素
  `${SCOPE} .side`, // サイドバー
];
const missing = EXPECTED.filter((e) => !selectors.has(e));
if (missing.length > 0) {
  console.error("\n!! 期待する変換結果が見つかりません:");
  for (const s of missing) console.error("   " + s);
  console.error("   index.css の構造が変わった可能性があります。sync-from-demo.mjs の transform を確認してください。");
  process.exit(1);
}

console.log(`全セレクタが ${SCOPE} 配下です。`);
