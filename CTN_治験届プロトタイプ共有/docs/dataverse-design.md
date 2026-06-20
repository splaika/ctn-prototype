# Dataverse設計書

## 役割

Dataverseは治験届データの正本DBとする。

対象:

- 治験シリーズ
- 届出
- 届出版
- PDF取込ジョブ
- 入力項目
- 医療機関
- 医師イベント
- 治験使用薬
- 外字マッピング
- 期限管理
- リマインダー
- 承認
- 出力ジョブ
- 監査証跡

## 主要テーブル

| テーブル | 役割 | 主キー/キー |
|---|---|---|
| `trial_series` | 治験識別記号単位の親 | `trial_code` |
| `submissions` | 各届出。初回届、変更届など | `trial_series_id + submission_round` |
| `submission_versions` | 届出の版。imported, confirmed, draft, approved | `submission_id + version_no` |
| `submission_snapshots` | 確定版の構造化スナップショット | `version_id + entity_name + record_key` |
| `pdf_import_jobs` | 既存PDF取込ジョブ | `id` |
| `pdf_import_pages` | PDFページ単位の抽出結果 | `import_job_id + page_no` |
| `pdf_import_field_candidates` | 抽出候補と人手確認 | `id` |
| `protocol_summaries` | 治験計画概要 | `submission_id` |
| `primary_product_details` | 主たる被験薬情報 | `submission_id` |
| `investigational_products` | 治験使用薬。突合キー型順序番号 | `trial_series_id + sequence_no` |
| `combination_products` | 併用製品等 | `submission_id + sequence_no` |
| `medical_institutions` | 実施医療機関 | `submission_id + sequence_no` |
| `doctor_master` | 不変の医師マスタ | `doctor_code` |
| `doctor_events` | 医師異動イベント行 | `submission_id + institution + role + sequence_no` |
| `charge_out_persons` | 費用負担者 | `submission_id + sequence_no` |
| `coordinating_investigators` | 治験調整医師 | `submission_id + sequence_no` |
| `contract_research_organizations` | CRO | `submission_id + sequence_no` |
| `smos_in_medical_institutions` | 医療機関別SMO | `medical_institution_id + sequence_no` |
| `irbs` | 医療機関別IRB | `medical_institution_id + sequence_no` |
| `gaiji_mappings` | 外字置換記録 | `id` |
| `regulatory_deadline_rules` | 期限ルール | `target_event_type + target_role` |
| `regulatory_deadlines` | 実期限インスタンス | `id` |
| `reminder_notifications` | 通知予定/送信結果 | `id` |
| `workflow_instances` | ワークフロー状態 | `id` |
| `approval_tasks` | 承認タスク | `submission_id + step_no` |
| `export_jobs` | PDF/XML出力ジョブ | `id` |
| `audit_events` | 独自監査証跡 | `id` |

## リレーション

- `trial_series` 1:N `submissions`
- `submissions` 1:N `submission_versions`
- `submission_versions` 1:N `submission_snapshots`
- `trial_series` 1:N `investigational_products`
- `submissions` 1:N `medical_institutions`
- `medical_institutions` 1:N `doctor_events`
- `doctor_master` 1:N `doctor_events`
- `medical_institutions` 1:N `irbs`
- `medical_institutions` 1:N `smos_in_medical_institutions`
- `submissions` 1:N `approval_tasks`
- `submissions` 1:N `export_jobs`
- `pdf_import_jobs` 1:N `pdf_import_field_candidates`

## 版管理

### 状態

| 状態 | 意味 |
|---|---|
| `imported` | PDFから取り込まれた未確認版 |
| `confirmed` | 人手確認済みの確定版 |
| `draft` | 変更届作成中 |
| `review` | レビュー中 |
| `approved` | 承認済み。出力可能 |
| `submitted` | 提出済み |
| `superseded` | 後続版に置き換え済み |

### 変更届作成

1. 最新の `confirmed` または `approved` 版を選ぶ。
2. `submission_versions.parent_version_id` に親版を設定する。
3. 子版を `draft` として作成する。
4. 差分入力する。
5. レビュー/承認後に `approved` として固定する。

## 順序番号

### 突合キー型

対象:

- 治験使用薬
- 含量/剤形別の薬剤

ルール:

- 計画届で採番した番号を終了届/中止届まで維持する。
- 削除しても詰め直さない。
- 数量情報は同じ順序番号で突合する。

### イベント行型

対象:

- 責任医師
- 分担医師
- 氏名変更

ルール:

- 届出ごとに1から採番する。
- 追加、削除、氏名変更を行として表す。
- 同一人物の追跡は `doctor_code` で行う。

## 監査

- Dataverse標準監査を有効化する。
- 重要イベントは `audit_events` にも明示的に記録する。
- 提出後の承認済み版は直接編集不可にする。
- 修正が必要な場合は新しい版を作る。

