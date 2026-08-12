// ============================================================================
// check-shared.mjs — src/shared/ が同期済みかを確かめる
// ----------------------------------------------------------------------------
// src/shared/ は demo/app/src からの生成物で Git 管理外（.gitignore 参照）。
// そのためクローン直後は存在せず、test も package も「モジュールが見つからない」
// という原因の分かりにくいエラーで落ちる。ここで先に止めて理由と対処を示す。
//
// test / package の前に自動で走る（package.json の pretest / prepackage）。
// ============================================================================
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHARED = join(ROOT, "src", "shared");

/** 同期後に必ず存在するもの。1つでも欠けていれば同期が不完全 */
const REQUIRED = [
  "i18n.ts",
  "styles.generated.ts",
  "ctn/logic.ts",
  "ctn/permissions.ts",
  "ctn/types.ts",
  "ctn/data/repository.ts",
  "ctn/data/mockRepository.ts",
];

function fail(lines) {
  console.error("");
  console.error("!! src/shared/ が同期されていません。");
  console.error("");
  for (const l of lines) console.error(`   ${l}`);
  console.error("");
  console.error("   対処:");
  console.error("     npm run sync");
  console.error("");
  console.error("   src/shared/ は demo/app/src からの生成物で Git 管理外です。");
  console.error("   共有コードを直すときは demo/app/src 側を編集してから同期してください");
  console.error("   （src/shared/ を直接編集しても次の同期で消えます）。");
  console.error("");
  process.exit(1);
}

if (!existsSync(SHARED)) {
  fail(["src/shared/ そのものが存在しません（クローン直後はこの状態です）。"]);
}

const missing = REQUIRED.filter((rel) => !existsSync(join(SHARED, rel)));
if (missing.length > 0) {
  fail([
    "同期が途中で終わっている可能性があります。欠けているファイル:",
    ...missing.map((m) => `  - src/shared/${m}`),
  ]);
}

// demo/app 側に無いファイルが残っていないかは見ない（sync が毎回作り直すため）。
// ここでは「使える状態か」だけを判定する。
const count = (await readdir(SHARED, { recursive: true })).length;
console.log(`src/shared/ は同期済み（${count} エントリ）。`);
