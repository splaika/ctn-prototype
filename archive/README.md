# archive — 現行の判断材料ではない資料

**ここにあるものを根拠に実装や判断をしないこと。** 経緯を辿るために残している。

現行の実装と設計は [`../ctn-spfx/`](../ctn-spfx/)、作業を再開するときは
[`../ctn-spfx/docs/引き継ぎ.md`](../ctn-spfx/docs/引き継ぎ.md) を読む。

## 中身

### `outputs/ctn-lp-static-safe-20260618-235143/`

2026-06-18 に書き出した LP と設計文書の静的スナップショット（20ファイル）。

**旧構想（Dataverse + プラグイン）前提の内容を含む。** `docs-html/dataverse-design.html`
`docs-html/sharepoint-design.html` などは、現在採用している SPFx + SharePoint リスト構成
とは別世代の設計。

現行の設計は以下を参照。

- リスト設計の単一ソース: [`../ctn-spfx/provision/ctn-lists.schema.json`](../ctn-spfx/provision/ctn-lists.schema.json)
- 対応表: [`../ctn-spfx/provision/columns.md`](../ctn-spfx/provision/columns.md)
- 設計の背景: [`../ctn-spfx/docs/sharepoint-db-design-notes.md`](../ctn-spfx/docs/sharepoint-db-design-notes.md)

### `outputs/ctn-lp-draft/`

LP のドラフトとスクリーンショット。営業・提案用の資料で、実装とは独立している。

### `outputs/CTN_SharePoint_DB設計_20260726.xlsx`

2026-07-26 時点の DB（リスト）設計書。版1.1・リスト13本・列133件。

**現行は9リスト・新規作成する列74。** この xlsx より後に実装で確定した内容が
`ctn-lists.schema.json` にあり、そちらが正。この文書は検討過程の記録。

### `dev-environment-setup.md`

Azure DevOps × VS Code × Claude Code の開発環境セットアップ手順。

**CTN 固有の内容ではない。** 複数PCから同じプロジェクトを継続開発するための汎用手順で、
このリポジトリの実装とは独立している。内容自体は現役なので、別PCで作業を始めるときは
参照してよい。CTN の実装を追う人が混乱しないよう `archive/` に置いた。

### `ctn-summary-review.md`

初期のレビューまとめ。
