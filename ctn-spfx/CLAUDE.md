# ctn-spfx — Claude Code エントリポイント

## 読む順序(必須)

1. `../CLAUDE.md` — 治験届の採番ツリー原則(業務の根幹。誤ると届出回数が誤値になる)
2. `../demo/app/docs/CTN_ハンドオフ.md` — ドメイン仕様・間違えやすい4ロジック
3. `docs/spfx-methodology.md` — 方式Bの設計判断(集約JSON・二層検証のトレードオフ・React 17)
4. `docs/ctn-spfx-migration-brief.md` — 実装手順。**Phase 0 から順に実施**

## 絶対条件(要約 — 詳細はブリーフ)

- `../demo/app` は無変更(`npm test` 34件と `npm run build:demo` を毎フェーズ末に確認)
- 共有コードは `scripts/sync-from-demo.mjs` で取り込む(手編集禁止ヘッダーを自動挿入)
- コンポーネントは `CtnRepository` のみに依存。ドメインロジック(`logic.ts` 等)の再実装・複製禁止
- 更新の `IF-MATCH` は実 etag(`*` 禁止)。提出時の採番は再取得→再計算→412リトライ
- 届は集約JSON(`CtnPayload`)+昇格列を同一書き込みで更新。日付は文字列保持
- Web パーツ既定は `dataSource: mock`。React は 17 を `--save-exact` 固定
