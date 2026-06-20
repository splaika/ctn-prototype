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

チームレビューだけなら、まず次のHTMLを直接開きます。サーバー不要です。

```text
team-site.html
```

サーバーで確認する場合:

```powershell
npm install
npm run build:site
npm run serve:static
```

このOneDrive配下のWindows環境では `npm run dev` の依存プリバンドル時にファイル解決エラーが出る場合があり、`vite preview` もバックグラウンド起動時に不安定になることがあります。レビュー用途では `team-site.html` を直接開く運用を優先します。サーバー確認が必要な場合だけ、`npm run build:site` 後に `npm run serve:static` を使います。

主要URL:

- `http://127.0.0.1:4173/ctn-operations-ui.html`: 最新のOperations UI
- `http://127.0.0.1:4173/team-site.html`: チーム共有サイト
- `http://127.0.0.1:4173/docs-html/index.html`: 設計書ビューア

## Azure Static Web Appsで共有する場合

画面遷移・入力操作を外部メンバーにURLで見せる場合は、Azure Static Web Appsに公開します。

```powershell
npm install
npm run build:site
```

公開対象は `dist/` です。GitHub Actionsで公開する場合は、`.github/workflows/azure-static-web-apps.yml` を使います。

Azure側のビルド設定:

```text
App location: /
Api location: 空欄
Output location: dist
Build command: npm run build:site
```

詳細手順は `docs/azure-static-web-apps-deploy.md` を参照してください。

## このプロジェクトでの注意

- `4173` 番を開くときは `vite preview` ではなく `npm run serve:static` を優先する。
- UIレビューはサーバー依存を避け、まず `team-site.html` を直接開く。
- HTMLモックを更新したら `npm run build:site` を実行し、`dist/` へ自動コピーしてから確認する。
- サーバーが開かない場合は、まず `dist/` 配下に対象HTMLがあるか確認する。

## UI方針

- 左側に各種メニュー、中央に実際の入力フィールドを配置
- ワークフローは入力画面から分離し、ダッシュボードで集中管理
- 医療機関、医師、治験使用薬、SMO/IRB、添付資料、外字は複数行入力を前提化
- 順序番号、変更/追加/削除/氏名変更のイベント、監査証跡を確認できる設計
- XML/PDF出力は承認後に実行する前提で、入力画面には常時表示しない

## SharePoint / Dataverse 実装設計書

- `docs/architecture-overview.md`: 全体アーキテクチャ、機能分担、設計判断
- docs/react-microsoft-implementation.md: React UI + Microsoft 365 / Azure 基盤でSaaS品質にする実装方針
- `docs/sharepoint-design.md`: SharePointサイト、ライブラリ、列、権限、保管ルール
- `docs/dataverse-design.md`: Dataverseテーブル、リレーション、キー、状態管理、外字・監査設計
- `docs/workflow-reminder-design.md`: 起票、レビュー、承認、出力、6か月/12か月期限リマインダー
- `docs/pdf-import-design.md`: 既存PDF取込、OCR/抽出候補、人手確認、版確定
- `docs/gaiji-handling-design.md`: 外字の原表記、届出用表記、置換マッピング、チェックロジック
- `docs/user-guide.md`: 担当者、レビュー担当、承認者向けユーザーガイド
- `docs/admin-guide.md`: 管理者向けの設定、運用、保守ガイド

