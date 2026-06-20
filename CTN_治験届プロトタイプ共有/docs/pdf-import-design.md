# 既存PDF取込・DB化設計書

## 目的

既にPDFで作成されている治験届を取り込み、今後の変更届作成に使える構造化データとしてDataverseへ登録する。

## 基本フロー

1. PDF原本をSharePoint `Source PDFs` に保存する。
2. `pdf_import_jobs` を作成する。
3. PDFページごとにテキスト抽出またはOCRを行う。
4. 抽出テキストをXSD項目にマッピングする。
5. `pdf_import_field_candidates` に候補値を保存する。
6. 人が候補値を確認する。
7. 確認済み候補から `submissions` と関連テーブルを作成する。
8. `submission_versions` に `imported` 版を作成する。
9. 人手確認後に `confirmed` 版として固定する。
10. 変更届は `confirmed` 版から `draft` を作成する。

## 取込ジョブ状態

| 状態 | 説明 |
|---|---|
| `uploaded` | PDF原本登録済み |
| `extracting` | テキスト/OCR抽出中 |
| `mapped` | 項目候補作成済み |
| `review_required` | 人手確認待ち |
| `confirmed` | DB確定済み |
| `failed` | 取込失敗 |

## 抽出候補

抽出候補は直接正本にしない。

候補に持つ情報:

- 対象テーブル
- 対象列
- XSD Element Name
- 候補値 原表記
- 候補値 届出用表記
- ページ番号
- 信頼度
- レビュー状態
- レビュー者
- レビュー日時

## 確認UI

Power AppsまたはPCFで以下を表示する。

- PDFページ画像
- 抽出候補
- 対応するXSD項目
- 候補値
- 修正欄
- 確定/却下
- 外字候補

## 版管理

| 版 | 例 | 説明 |
|---|---|---|
| imported | `v1.0 imported` | PDF抽出直後 |
| confirmed | `v1.0 confirmed` | 人手確認済み |
| draft | `v1.1 draft` | 変更届入力中 |
| approved | `v1.1 approved` | 承認済み |
| submitted | `v1.1 submitted` | 提出済み |

## 注意点

- PDFはレイアウト情報が強く、抽出値は誤認識があり得る。
- 暗号化PDFや画像PDFではOCRが必要。
- 外字はOCRで崩れやすいため、必ず外字候補レビューへ回す。
- 取込時の信頼度が低い項目はレビュー必須にする。
- 原本PDF、抽出ログ、確定データを紐づけて監査可能にする。

