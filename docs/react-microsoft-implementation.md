# React UI + Microsoft 基盤 実装方針

## 方針

Power Apps の画面表現に寄せるのではなく、React/Vite で SaaS 型の業務 UI を作り、Microsoft 365 / Azure / Power Platform を業務基盤として接続する。

## 役割分担

| 領域 | 採用技術 | 役割 |
| --- | --- | --- |
| フロントエンド | React / Vite | 左ナビ、ダッシュボード、入力フォーム、テーブル、検索、状態表示 |
| 認証 | Microsoft Entra ID | 社内アカウント、ロール、アクセス制御 |
| 正本データ | Dataverse | 届出、変更イベント、マスタ、XSD項目、承認状態 |
| 文書管理 | SharePoint | PDF原本、添付資料、外字説明資料、出力済みPDF/XML |
| 通知・承認 | Power Automate / Teams | レビュー依頼、差戻し、期限通知、承認連絡 |
| 変換・検証 | Azure Functions | PDF/OCR処理、XML生成、XSD検証、外字資料生成 |
| 開発・配布 | GitHub / Azure Static Web Apps | ソース管理、レビュー、継続デプロイ |

## なぜ Power Apps 単体にしないか

- 画像のような SaaS 品質のUIを継続的に作り込むには、CSS/React の自由度が必要。
- 治験届は入力項目が多く、テーブル、カード、状態バッジ、検索、レビュー導線を高密度に扱う必要がある。
- XSD項目との対応、PDF取込、人手確認、差分比較などは、画面部品を柔軟に作れるReactのほうが向く。

## Power Platform はどこで使うか

Power Apps は本体UIではなく、簡易管理画面や補助確認画面に限定する。Power Automate は通知・承認・期限リマインダーに使い、Dataverse は業務データの正本として使う。

## 最初の実装ステップ

1. React UIをAzure Static Web Appsに配置する。
2. Microsoft Entra ID認証を追加する。
3. Dataverseに届出、変更イベント、マスタ、添付資料リンクのテーブルを作る。
4. SharePointに治験届ドキュメントライブラリを作る。
5. Azure FunctionsでPDF取込、XML生成、XSD検証を実装する。
6. Power AutomateでTeams通知と承認フローを接続する。

## Codexプラグインの使い分け

- Figma: UI仕様、余白、色、コンポーネントの整理
- GitHub: React / Azure Functions / XSD検証コードの管理
- SharePoint: 添付資料、テンプレート、出力物の参照
- Teams: レビュー依頼、承認、差戻し連絡

