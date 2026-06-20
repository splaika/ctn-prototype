# Azure Static Web Apps 公開手順

## 目的

このプロトタイプは、画面遷移と入力操作をレビューするためのフロントエンドモックです。保存用バックエンドやワークフロー実行基盤は含めず、Azure Static Web Appsで静的Webサイトとして公開します。

## 公開される入口

- `/`: React版モック本体。画面遷移と入力操作を確認する入口です。
- `/team-site.html`: モック、マニュアル、設計書への共有サイトです。
- `/ctn-ux-react-standalone.html`: サーバー不要の単一HTML版です。
- `/ctn-ux-manual.html`: 操作マニュアルです。
- `/docs-html/index.html`: 設計書ビューアです。

## ローカルでの生成

```powershell
npm install
npm run build:site
```

生成物は `dist/` に出力されます。Azure Static Web Appsにはこの `dist/` を公開します。

## Azure Portalで作成する場合

1. Azure Portalで `Static Web App` を作成します。
2. Planは、まずレビュー用途なら `Free` で構いません。
3. Deployment sourceはGitHubを選択します。
4. Build Detailsは `Custom` を選択します。
5. 以下を指定します。

```text
App location: /
Api location: 空欄
Output location: dist
Build command: npm run build:site
```

6. GitHub Actionsのsecretに `AZURE_STATIC_WEB_APPS_API_TOKEN` が登録されていることを確認します。
7. `main` ブランチへpushすると自動デプロイされます。手動で実行したい場合はGitHub Actionsの `workflow_dispatch` から実行できます。

## 公開後の確認

公開URLで以下を確認します。

- `/` を開くとReact版モックが表示される
- 左メニューで「既存データ取り込み」「届出作成」「マスタ管理」へ遷移できる
- 届出作成の入力フィールドに入力できる
- マスタ管理の一覧と入力フィールドを確認できる
- `/team-site.html` からマニュアルや設計書へ移動できる

## 注意

現時点のモックはブラウザ上で入力できますが、入力値は永続保存されません。レビュー参加者が同時に同じデータを編集・保存する用途にする場合は、Dataverse、SharePoint List、Azure Functionsなどの保存先が別途必要です。

外部メンバーに限定公開したい場合は、Azure Static Web Appsの認証・ロール、またはStandardプランのネットワーク制御を検討します。

## 参考

- Microsoft Learn: Build configuration for Azure Static Web Apps
- Microsoft Learn: Configure Azure Static Web Apps
