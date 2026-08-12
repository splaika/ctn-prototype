// ============================================================================
// sync-from-demo.mjs — demo/app の共有ソースを SPFx 側へ取り込む
// ----------------------------------------------------------------------------
// 単一ソースは demo/app/src。本スクリプトが src/shared/ を再生成する。
// src/shared/ 配下は手編集禁止（再同期で上書きされる）。
//
//   node scripts/sync-from-demo.mjs [--source <dir>] [--accept-app-drift]
//
// 生成物:
//   src/shared/ctn/**            … 逐語コピー（DO NOT EDIT ヘッダー付与）
//   src/shared/i18n.ts           … 逐語コピー
//   src/shared/ctn/data/repository.ts … getRepository() を SPFx 用に差し替え
//   src/shared/styles.generated.ts    … index.css を .ctnApp スコープへ変換した文字列
//
// App.tsx は逐語コピーしない（SPFx 側 CtnApp.tsx が適応版を保持）。
// 代わりにハッシュを記録し、demo 側が変わったら気付けるようにする。
// ============================================================================
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import prefixSelector from "postcss-prefix-selector";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SOURCE = resolve(ROOT, opt("--source", "../demo/app/src"));
const DEST = join(ROOT, "src", "shared");
const SCOPE = ".ctnApp";

/** 同期対象から外すファイル（SPFx 側では使わない） */
const EXCLUDE = new Set([
  "ctn/data/dataverseRepository.ts", // Dataverse 実装は SPFx 版に持ち込まない
  "ctn/logic.test.ts", // テストは demo/app 側で実行し続ける
  "ctn/permissions.test.ts", // 同上
]);

const HEADER = [
  "// ===========================================================================",
  "// AUTO-GENERATED — 手編集禁止",
  "// scripts/sync-from-demo.mjs が demo/app/src から生成。再同期で上書きされます。",
  "// 変更は単一ソース demo/app/src/{rel} 側で行ってください。",
  "// ===========================================================================",
  "",
].join("\n");

/** ディレクトリ配下のファイルを再帰列挙（SOURCE からの相対パスを返す） */
async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(relative(base, full).split("\\").join("/"));
  }
  return out;
}

/**
 * repository.ts の getRepository() は import.meta.env（Vite 専用）と
 * DataverseCtnRepository に依存する。SPFx バンドルにこれらを持ち込めないため、
 * ファクトリを「Web パーツが注入した実装を返す」形へ差し替える。
 * ※ アンカー行が見つからなければ失敗させる（demo 側の変更に気付くため）
 */
function patchRepository(src, rel) {
  const ANCHOR = "let _repo: CtnRepository | null = null;";
  const at = src.indexOf(ANCHOR);
  if (at < 0) {
    throw new Error(
      `patchRepository: アンカー "${ANCHOR}" が ${rel} に見つかりません。` +
        " demo 側の repository.ts が変更された可能性があります。"
    );
  }
  const replacement = [
    ANCHOR,
    "",
    "// --- SPFx 差し替え部（sync-from-demo.mjs が生成）------------------------------",
    "// demo/app 側の import.meta.env 分岐と DataverseCtnRepository への依存を除去し、",
    "// Web パーツが選んだ実装（mock / sharepoint）を注入する形にしている。",
    "",
    "/** Web パーツ起動時に実装を注入する。 */",
    "export function setRepository(repo: CtnRepository): void {",
    "  _repo = repo;",
    "}",
    "",
    "/** コンポーネントが参照するファクトリ。注入前に呼ばれたら実装ミスなので投げる。 */",
    "export function getRepository(): CtnRepository {",
    "  if (!_repo) {",
    "    throw new Error(",
    '      "CtnRepository が未注入です。CtnSuiteWebPart が setRepository() を呼ぶ前に" +',
    '        "コンポーネントが getRepository() を呼び出しました。"',
    "    );",
    "  }",
    "  return _repo;",
    "}",
    "",
  ].join("\n");
  return src.slice(0, at) + replacement;
}

/** index.css の全セレクタを .ctnApp 配下へ閉じ込める */
async function scopeCss(css) {
  const result = await postcss([
    prefixSelector({
      prefix: SCOPE,
      transform(prefix, selector, prefixedSelector, _filePath, rule) {
        // @keyframes 内の from/to/50% はセレクタではないので触らない
        let parent = rule && rule.parent;
        while (parent) {
          if (parent.type === "atrule" && /keyframes$/i.test(parent.name)) return selector;
          parent = parent.parent;
        }
        // :root のカスタムプロパティはラッパー要素へ載せる（ページ全体に漏らさない）
        if (selector === ":root" || selector === "html") return prefix;
        // body{...} はラッパー要素自身のスタイルになる（body.ja → .ctnApp.ja）
        if (selector === "body") return prefix;
        if (selector.startsWith("body.") || selector.startsWith("body:")) {
          return prefix + selector.slice("body".length);
        }
        if (selector.startsWith("body ")) return prefix + " " + selector.slice("body ".length);
        // 全称セレクタのリセットはラッパーとその子孫だけに効かせる
        if (selector === "*") return `${prefix}, ${prefix} *`;
        return prefixedSelector;
      },
    }),
  ]).process(css, { from: undefined });
  return result.css;
}

/** CSS 文字列をテンプレートリテラルとして安全に埋め込む */
function toTsStringModule(css, rel) {
  const escaped = css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return [
    HEADER.replace("{rel}", rel),
    "// index.css の全セレクタを " + SCOPE + " スコープへ変換したもの。",
    "// SPFx の CSS ローダーを経由せず、Web パーツが <style> として注入する。",
    "",
    "export const CTN_SCOPED_CSS: string = `" + escaped + "`;",
    "",
  ].join("\n");
}

async function main() {
  if (!existsSync(SOURCE)) {
    throw new Error(`同期元が見つかりません: ${SOURCE}`);
  }

  await rm(DEST, { recursive: true, force: true });
  await mkdir(DEST, { recursive: true });

  const files = (await walk(join(SOURCE, "ctn"))).map((f) => `ctn/${f}`);
  files.push("i18n.ts");

  let copied = 0;
  for (const rel of files) {
    if (EXCLUDE.has(rel)) continue;
    const target = join(DEST, rel);
    await mkdir(dirname(target), { recursive: true });

    if (rel.endsWith(".json")) {
      // JSON にコメントは書けないので逐語コピー
      await writeFile(target, await readFile(join(SOURCE, rel)));
      copied++;
      continue;
    }

    let body = await readFile(join(SOURCE, rel), "utf8");
    if (rel === "ctn/data/repository.ts") body = patchRepository(body, rel);
    await writeFile(target, HEADER.replace("{rel}", rel) + body, "utf8");
    copied++;
  }

  // index.css → .ctnApp スコープの TS 文字列モジュール
  const css = await readFile(join(SOURCE, "index.css"), "utf8");
  const scoped = await scopeCss(css);
  await writeFile(join(DEST, "styles.generated.ts"), toTsStringModule(scoped, "index.css"), "utf8");

  // App.tsx のドリフト検出（SPFx 側は CtnApp.tsx が適応版を持つ）
  const appSrc = await readFile(join(SOURCE, "App.tsx"), "utf8");
  const hash = createHash("sha256").update(appSrc).digest("hex");
  const hashFile = join(HERE, "app-tsx.sha256");
  const known = existsSync(hashFile) ? (await readFile(hashFile, "utf8")).trim() : "";

  console.log(`同期完了: ${copied} ファイル → ${relative(ROOT, DEST)}`);
  console.log(`CSS スコープ化: index.css → styles.generated.ts (${SCOPE})`);

  if (known && known !== hash) {
    console.error("");
    console.error("!! demo/app/src/App.tsx が前回同期時から変更されています。");
    console.error(`   記録: ${known}`);
    console.error(`   現在: ${hash}`);
    console.error("   SPFx 側の src/webparts/ctnSuite/CtnApp.tsx へ反映が必要か確認してください。");
    console.error("   確認・反映済みなら --accept-app-drift を付けて再実行するとハッシュを更新します。");
    if (!flag("--accept-app-drift")) process.exit(1);
  }
  if (known !== hash) {
    await writeFile(hashFile, hash + "\n", "utf8");
    console.log(`App.tsx ハッシュを記録: ${hash.slice(0, 12)}…`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
