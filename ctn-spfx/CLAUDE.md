# ctn-spfx — Claude Code エントリポイント

## 作業を再開するときは、まず引き継ぎメモを読む

> **[`docs/引き継ぎ.md`](docs/引き継ぎ.md)**
>
> 実装（Phase 0〜4）は完了済み。実テナント（seventoone）へのデプロイ途中で、
> **アプリカタログには古い 1.0.0.0 が入ったまま**という状態にある。
>
> 実テナントで踏んだ不具合の根本原因（**OData v3/v4 記法の取り違え** —
> etag が `@odata.etag` に載るのを `odata.etag` と読んでいた）、
> 踏んだ落とし穴、保留中の判断、再開手順がそこにまとまっている。
> **リポジトリを読んでも分からないことは、あのファイルにしか書いていない。**

## 読む順序(必須)

1. `docs/引き継ぎ.md` — 現在の状態と再開手順（上記）
2. `../CLAUDE.md` — 治験届の採番ツリー原則(業務の根幹。誤ると届出回数が誤値になる)
3. `../demo/app/docs/CTN_ハンドオフ.md` — ドメイン仕様・間違えやすい4ロジック
4. `docs/spfx-methodology.md` — 方式Bの設計判断(集約JSON・二層検証のトレードオフ・React 17)
5. `docs/ctn-spfx-migration-brief.md` — 元の実装ブリーフ（実装済み。経緯の参照用）

## 絶対条件(要約 — 詳細はブリーフ)

- `../demo/app` は単一ソース。変更は最小限にとどめ、`npm test`(41件)と
  `npm run build:demo` の通過を必ず確認する
  （採番ロジックの `logic.ts` への抽出と UI 改善2件のみ、承認を得て変更済み）
- 共有コードは `scripts/sync-from-demo.mjs` で取り込む(手編集禁止ヘッダーを自動挿入)。
  `src/shared/**` は生成物なので直接編集しない
- コンポーネントは `CtnRepository` のみに依存。ドメインロジック(`logic.ts` 等)の再実装・複製禁止
- 更新の `IF-MATCH` は実 etag(`*` 禁止)。提出時の採番は再取得→再計算→412リトライ
- 届は集約JSON(`CtnPayload`)+昇格列を同一書き込みで更新。日付は文字列保持
- Web パーツ既定は `dataSource: mock`。React は 17 を `--save-exact` 固定
- **SPFx は OData v4。** 応答の etag は `@odata.etag`、Accept は `odata.metadata=minimal`、
  型指定は `@odata.type`。v3 記法(`odata=nometadata` / `__metadata`)は使わない
- **`solution.version` はリリースのたびに上げる。** 固定するとどの版が動いているか判別できない
- **`.sppkg` を渡す前に中身を検証する。** `release/` の残骸が混入して古いバンドルを
  指す事故が起きうる（手順は引き継ぎメモ 6 章）
