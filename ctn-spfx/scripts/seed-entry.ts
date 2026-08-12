// ============================================================================
// seed-entry.ts — デモデータを JSON として標準出力へ書く
// ----------------------------------------------------------------------------
// gen-browser-seed.mjs が esbuild でバンドルして実行するためのエントリ。
// デモデータの単一ソースは demo/app/src/ctn/data/seed.ts（src/shared は同期物）。
// ここでデータを複製しないこと。
// ============================================================================
import { makeSeedDb } from "../src/shared/ctn/data/seed";
import { NOTIF_TYPE_SHORT } from "../src/shared/ctn/refData";

process.stdout.write(
  JSON.stringify({
    db: makeSeedDb(),
    // 届の表示名（Title 列）の組み立てに使う
    notifTypeShort: NOTIF_TYPE_SHORT,
  })
);
