# 治験届 作成支援システム プロトタイプ

このフォルダは、治験届の入力、既存PDF取込、版管理、ワークフロー、期限リマインダー、外字対応を検討するためのReact/Viteプロトタイプです。

## 構成

- `src/main.jsx`: 左メニュー、中央入力エリア、ダッシュボード、PDF取込、複数行入力を備えたReact UI
- `src/schema.js`: 治験届の主要入力セクションとフィールド定義
- `src/styles.css`: 治験届管理UI用のスタイル
- `database/schema.sql`: Dataverse/DB化を見据えたテーブル設計
- `docs/`: SharePoint、Dataverse、PDF取込、外字、ワークフロー、ユーザーガイドの設計書
- `iykckn_all_v3_0_0.xsd`: 電子届出XML Schema

## 起動

```powershell
npm install
npm run build
npm run preview -- --port 4173
```

このOneDrive配下のWindows環境では `npm run dev` の依存プリバンドル時にファイル解決エラーが出る場合があります。画面確認には `build` 後の `preview` を使うのが安定しています。

## UI方針

- 左側に各種メニュー、中央に実際の入力フィールドを配置
- ワークフローは入力画面から分離し、ダッシュボードで集中管理
- 医療機関、医師、治験使用薬、SMO/IRB、添付資料、外字は複数行入力を前提化
- 順序番号、変更/追加/削除/氏名変更のイベント、監査証跡を確認できる設計
- XML/PDF出力は承認後に実行する前提で、入力画面には常時表示しない

## SharePoint / Dataverse 実装設計書

- `docs/architecture-overview.md`: 全体アーキテクチャ、機能分担、設計判断
- `docs/sharepoint-design.md`: SharePointサイト、ライブラリ、列、権限、保管ルール
- `docs/dataverse-design.md`: Dataverseテーブル、リレーション、キー、状態管理、外字・監査設計
- `docs/workflow-reminder-design.md`: 起票、レビュー、承認、出力、6か月/12か月期限リマインダー
- `docs/pdf-import-design.md`: 既存PDF取込、OCR/抽出候補、人手確認、版確定
- `docs/gaiji-handling-design.md`: 外字の原表記、届出用表記、置換マッピング、チェックロジック
- `docs/user-guide.md`: 担当者、レビュー担当、承認者向けユーザーガイド
- `docs/admin-guide.md`: 管理者向けの設定、運用、保守ガイド
