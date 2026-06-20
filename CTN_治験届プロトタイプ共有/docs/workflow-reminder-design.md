# ワークフロー・リマインダー設計書

## ワークフロー

ワークフローは各入力ページではなく、ダッシュボードで集中管理する。

## ステップ

| ステップ | 説明 | 操作可能者 |
|---|---|---|
| 起票 | 届出ドラフトを作成 | 起票者 |
| レビュー | 入力内容、外字、順序番号、添付資料を確認 | レビュー担当 |
| 承認 | 電子署名付きで承認 | 承認者 |
| PDF確認 | 承認済みデータからPDFイメージを生成して確認 | 起票者/承認者 |
| 出力 | PDF/XML/XSD検証結果を生成しSharePointへ保存 | システム |

## 出力制御

- `submission_versions.version_status = approved` になるまで出力不可。
- 承認前のPDFは参考プレビューのみ。正式出力扱いにしない。
- 承認後、`export_jobs` を作成する。
- 出力物はSharePoint `Generated Outputs` に保存する。

## 期限管理

分担医師などの変更は、実際の変更日を起点に6か月または12か月以内に届出が必要になるケースがある。

### 期限ルール例

| 変更内容 | 期限 | 通知 |
---|---:|---|
| 分担医師 追加 | 6か月以内 | 60/30/14/7/1日前 |
| 分担医師 削除 | 6か月以内 | 60/30/14/7/1日前 |
| 責任医師 氏名変更 | 12か月以内 | 90/60/30/14/7日前 |
| SMO業務範囲変更 | 6か月以内 | 60/30/14/7日前 |
| CRO業務範囲変更 | 6か月以内 | 60/30/14/7日前 |

## テーブル

### regulatory_deadline_rules

期限ルールのマスタ。

| 列 | 説明 |
|---|---|
| `target_event_type` | 追加、削除、氏名変更など |
| `target_role` | 分担医師、責任医師、SMO、CROなど |
| `due_months` | 6または12など |
| `reminder_days_csv` | 60,30,14,7,1など |

### regulatory_deadlines

実際の期限インスタンス。

| 列 | 説明 |
|---|---|
| `actual_change_date` | 実変更日 |
| `due_date` | 届出期限 |
| `owner` | 担当者 |
| `approver` | 承認者 |
| `status` | open, drafted, submitted, closed, overdue |

### reminder_notifications

通知予定と送信結果。

| 列 | 説明 |
|---|---|
| `deadline_id` | 期限インスタンス |
| `notify_to` | 通知先 |
| `notify_role` | owner, approverなど |
| `scheduled_for` | 通知予定日 |
| `sent_at` | 送信日時 |
| `channel` | email, Teamsなど |
| `status` | scheduled, sent, failed, cancelled |

## Power Automate設計

### フロー1: 期限作成

トリガー:

- `doctor_events` 作成/更新
- `smos_in_medical_institutions` 作成/更新
- `contract_research_organizations` 作成/更新

処理:

1. 変更種別と役割から `regulatory_deadline_rules` を検索。
2. 実変更日 + 期限月数で `due_date` を計算。
3. `regulatory_deadlines` を作成。
4. `reminder_days_csv` に従い `reminder_notifications` を作成。

### フロー2: リマインダー送信

トリガー:

- 毎日朝

処理:

1. `scheduled_for <= today` かつ `status = scheduled` を検索。
2. 担当者と承認者へTeams/メール通知。
3. 送信成功時に `sent_at` と `status = sent` を更新。

### フロー3: 期限超過検知

トリガー:

- 毎日朝

処理:

1. `due_date < today` かつ未提出の期限を検索。
2. `status = overdue` に更新。
3. 管理者、担当者、承認者へ通知。

