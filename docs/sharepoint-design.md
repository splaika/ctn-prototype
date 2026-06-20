# SharePoint設計書

## 役割

SharePointは正本DBではなく、文書保管と共同確認の基盤として利用する。

主な用途:

- 既存PDF原本の保管
- OCR/抽出対象PDFの保管
- 添付資料の保管
- 外字置換説明資料の保管
- 承認後に生成されたPDF/XMLの保管
- 出力物の版管理
- Power Apps/Dataverseからの文書リンク先

## サイト構成

| サイト/ライブラリ | 用途 |
|---|---|
| `CTN Documents` | 治験届関連文書の親サイト |
| `Source PDFs` | 既存PDF原本、取込対象PDF |
| `Attachments` | Protocol、IB、ICF、非臨床資料、その他添付資料 |
| `Generated Outputs` | 承認後PDF、XML、XSD検証結果 |
| `Gaiji Explanations` | 外字置換説明資料 |
| `Import Work` | OCR中間成果物、ページ画像、抽出ログ |

## Document Library列定義

### Source PDFs

| 列名 | 型 | 必須 | 説明 |
|---|---|---:|---|
| `TrialCode` | Single line text | Yes | 治験識別記号 |
| `SubmissionRound` | Number | No | 届出回数 |
| `SubmissionType` | Choice | Yes | 初回届、変更届、中止届、終了届など |
| `ImportJobId` | Single line text | No | DataverseのPDF取込ジョブID |
| `ImportStatus` | Choice | Yes | Uploaded, Extracting, ReviewRequired, Confirmed, Failed |
| `Checksum` | Single line text | Yes | 原本同一性確認用 |
| `OriginalFileName` | Single line text | Yes | 取込時ファイル名 |
| `ConfidentialityLabel` | Choice/Label | Yes | 機密区分 |

### Attachments

| 列名 | 型 | 必須 | 説明 |
|---|---|---:|---|
| `TrialCode` | Single line text | Yes | 治験識別記号 |
| `SubmissionId` | Single line text | Yes | Dataverse届出ID |
| `SequenceNo` | Number | Yes | 添付資料順序番号 |
| `DocumentType` | Choice | Yes | Protocol, IB, ICF, Gaiji, Nonclinical, Other |
| `DocumentNameForSubmission` | Single line text | Yes | 届出用資料名 |
| `BookmarkStatus` | Choice | No | 未確認、確認済、不備 |
| `ReviewStatus` | Choice | Yes | Draft, Reviewed, Approved |
| `Checksum` | Single line text | Yes | 改ざん検知用 |

### Generated Outputs

| 列名 | 型 | 必須 | 説明 |
|---|---|---:|---|
| `TrialCode` | Single line text | Yes | 治験識別記号 |
| `SubmissionVersionId` | Single line text | Yes | Dataverse版ID |
| `ExportJobId` | Single line text | Yes | 出力ジョブID |
| `OutputType` | Choice | Yes | PDF, XML, XSD_RESULT |
| `ApprovedAt` | DateTime | Yes | 承認日時 |
| `GeneratedAt` | DateTime | Yes | 生成日時 |
| `XsdValidationResult` | Choice | No | Pass, Warning, Error |
| `Checksum` | Single line text | Yes | 出力物同一性 |

## SharePoint Listを使う場合

軽量なビューやマスタ補助にはSharePoint Listを使える。ただし正本管理、監査、複雑なリレーション、期限計算はDataverse側に置く。

候補:

- 外字置換辞書の閲覧用リスト
- 添付資料チェックリスト
- FAQ/ユーザーガイド
- 承認フロー説明

## 権限

| ロール | 権限 |
|---|---|
| 起票者 | Source PDFsアップロード、Attachments追加、ドラフト文書編集 |
| レビュー担当 | 文書閲覧、コメント、レビュー状態更新 |
| 承認者 | 承認済み文書閲覧、承認後出力確認 |
| 管理者 | ライブラリ設定、保持ポリシー、監査確認 |
| システム | Generated Outputs作成、Import Work作成 |

## 保持・監査

- Source PDFsは原本として削除不可ポリシーを検討する。
- Generated Outputsは承認済み版と紐づけ、上書き禁止にする。
- 文書の変更履歴を有効化する。
- Purviewラベル、DLP、保持ラベルの適用を検討する。

