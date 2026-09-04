# リスト列 対応表（自動生成）

> このファイルは `scripts/gen-provision.mjs` が `provision/ctn-lists.schema.json` から生成します。
> 直接編集しないでください。列を変えるときはスキーマJSONを直して再生成します。

`demo/app/src/ctn/types.ts` のプロパティと SharePoint リスト列の対応です。

## 規則

- 内部名は `Ctn` プレフィックス必須（`Level` / `Status` / `Owner` 等の予約名との衝突回避）
- 日付は **1行テキスト**で保持（SharePoint の日付型はタイムゾーンでずれるため）
- 数値 choice は数値列、文字列 union は選択肢列
- 論理削除は `CtnActive`（はい/いいえ）。物理削除は実装しない
- `Title` は一覧の可読性のためリポジトリが組み立てて入れる表示名
- 参照列への書き込みは `{内部名}Id`（例 `CtnCompoundId`）に数値で行う
- 全リストでバージョン管理を有効化する

## ロール用 SharePoint グループ

ロールはリストではなくサイトグループの所属から解決します（`src/data/roleResolver.ts`）。

| グループ名 | ロール | 用途 |
| --- | --- | --- |
| CTN 起票担当 | `drafter` | 治験届の起票・編集を行う |
| CTN レビュー担当 | `reviewer` | 社内レビュー・レビュー完了（提出）・XML生成を行う。起票者との兼務は職務分離で拒否される |

どのグループにも属さないユーザーは最小権限の `drafter` として扱われます（承認はできません）。

## CtnNotifications

**表示名**: CTN 治験届　**対応する型**: `Notification`

治験届。集約全体を CtnPayload(JSON) に保持し、一覧・絞り込み用に主要項目を昇格列へ投影する。正は CtnPayload。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| (表示名) | `Title` | 1行テキスト | 既定列。例: ABC-123 届2/変1 変更届。保存時にリポジトリが組み立てる |
| `compoundId` | `CtnCompound` | 参照 → `CtnCompounds` | 一覧の絞り込み用。書き込みは CtnCompoundId |
| `notifType` | `CtnNotifType` | 選択肢（plan / change / termination / completion / devDiscontinuation） | NotifTypeKey の値をそのまま選択肢値に |
| `filingCount` | `CtnFilingCount` | 数値 | 届出回数 |
| `changeCount` | `CtnChangeCount` | 数値 | 変更回数（計画届等は空） |
| `status` | `CtnStatus` | 選択肢（draft / review / submitted） | — |
| `protocolNo` | `CtnProtocolNo` | 1行テキスト | 実施計画書識別記号 |
| `noteDate` | `CtnNoteDate` | 1行テキスト | 届出年月日 YYYY-MM-DD（TZずれ回避のため日付型にしない） |
| `createdBy` | `CtnCreatedByUser` | 1行テキスト | loginName。職務分離の判定に使用 |
| `reviewedBy` | `CtnReviewedByUser` | 1行テキスト | loginName。レビュー完了者。起票者と異なることを強制（職務分離） |
| (集約全体) | `CtnPayload` | 複数行テキスト（プレーン） | Notification 集約全体の JSON（studyDrugs/sites/attachments/references/inquiries を含む） |
| (スキーマ版) | `CtnPayloadVersion` | 1行テキスト | ペイロードのスキーマ版。初期値 1 |

## CtnCompounds

**表示名**: CTN 治験成分　**対応する型**: `Compound`

治験成分（シリーズ親）。届出をまたぐ共通事項を保持する。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `compoundCode` | `Title` | 1行テキスト | 既定列。治験成分記号をそのまま表示名にする |
| `compoundCode` | `CtnCompoundCode` | 1行テキスト | 半角英数字20桁以内・「&」不可 |
| `targetCategory` | `CtnTargetCategory` | 数値 | 対象区分（医薬品/医療機器/再生医療等製品） |
| `trialKind` | `CtnTrialKind` | 1行テキスト | — |
| `initReceptNo` | `CtnInitReceptNo` | 1行テキスト | 初回届出受付番号 |
| `initNoteDate` | `CtnInitNoteDate` | 1行テキスト | 初回届出年月日 YYYY-MM-DD |
| `devStatus` | `CtnDevStatus` | 数値 | 開発状態（開発中/開発中止）。開発中止届の提出で更新される |
| `sponsorId` | `CtnSponsor` | 参照 → `CtnSponsors` | 主たる届出者 |
| `drugName` | `CtnDrugName` | 1行テキスト | 代表的な被験薬名称（表示用） |
| `createdAt` | `CtnCreatedAt` | 1行テキスト | — |

## CtnSponsors

**表示名**: CTN 治験届出者　**対応する型**: `Sponsor`

治験届出者。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `name` | `Title` | 1行テキスト | 既定列 |
| `sponsorType` | `CtnSponsorType` | 1行テキスト | 届出者の種別 |
| `name` | `CtnName` | 1行テキスト | 届出者の名称 |
| `repName` | `CtnRepName` | 1行テキスト | 代表者の氏名 |
| `address1` | `CtnAddress1` | 1行テキスト | — |
| `address2` | `CtnAddress2` | 1行テキスト | — |
| `manufacturerCode` | `CtnManufacturerCode` | 1行テキスト | 業者コード |
| `contactName` | `CtnContactName` | 1行テキスト | 届出担当者の氏名 |
| `contactTitle` | `CtnContactTitle` | 1行テキスト | 届出担当者の所属 |
| `telNo` | `CtnTelNo` | 1行テキスト | — |
| `faxOrMail` | `CtnFaxOrMail` | 1行テキスト | — |
| `overseasInfo` | `CtnOverseasInfo` | 複数行テキスト（プレーン） | 海外依頼者・外国製造業者情報（該当時のみ・要確認） |
| `active` | `CtnActive` | はい/いいえ | 論理削除（false=無効） |

## CtnInstitutions

**表示名**: CTN 医療機関　**対応する型**: `Institution`

医療機関マスタ。論理削除で履歴を保持する。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `name` | `Title` | 1行テキスト | 既定列 |
| `code` | `CtnCode` | 1行テキスト | 表示用の機関コード |
| `name` | `CtnName` | 1行テキスト | 機関名称 |
| `address1` | `CtnAddress1` | 1行テキスト | — |
| `address2` | `CtnAddress2` | 1行テキスト | — |
| `telNo` | `CtnTelNo` | 1行テキスト | 代表電話番号 |
| `departments` | `CtnDepartments` | 複数行テキスト（プレーン） | 実施診療科の候補（改行区切り）。届の実施診療科の選択肢になる |
| `active` | `CtnActive` | はい/いいえ | — |

## CtnDoctors

**表示名**: CTN 医師　**対応する型**: `Doctor`

医師マスタ。SharePoint の Id が不変の同一性キー（改名しても不変）。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `nameFiling` | `Title` | 1行テキスト | 既定列 |
| `doctorNo` | `CtnDoctorNo` | 1行テキスト | 医師表示ID |
| `nameOriginal` | `CtnNameOriginal` | 1行テキスト | 氏名（原表記） |
| `nameFiling` | `CtnNameFiling` | 1行テキスト | 氏名（届出用表記＝外字正規化済み） |
| `pronounce` | `CtnPronounce` | 1行テキスト | よみかな |
| `medSchoolNo` | `CtnMedSchoolNo` | 1行テキスト | 大学番号 |
| `graduationYear` | `CtnGraduationYear` | 1行テキスト | — |
| `hasGaiji` | `CtnHasGaiji` | はい/いいえ | 外字有無（検出結果） |
| `institutionId` | `CtnInstitution` | 参照 → `CtnInstitutions` | 任意。主たる所属医療機関（任意） |
| `active` | `CtnActive` | はい/いいえ | — |

## CtnSiteStaff

**表示名**: CTN 現場担当　**対応する型**: `SiteStaff`

CRC・SMO事務局。XML対象外だが運用で必須の連絡先。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `name` | `Title` | 1行テキスト | 既定列 |
| `name` | `CtnName` | 1行テキスト | — |
| `kana` | `CtnKana` | 1行テキスト | — |
| `role` | `CtnStaffRole` | 選択肢（CRC / 事務局 / 薬剤部） | 予約名衝突を避けるため Role ではなく CtnStaffRole |
| `institutionId` | `CtnInstitution` | 参照 → `CtnInstitutions` | — |
| `telNo` | `CtnTelNo` | 1行テキスト | — |
| `mail` | `CtnMail` | 1行テキスト | — |
| `active` | `CtnActive` | はい/いいえ | — |

## CtnIrbs

**表示名**: CTN 治験審査委員会　**対応する型**: `Irb`

IRB マスタ。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `ownerName` | `Title` | 1行テキスト | 既定列 |
| `irbType` | `CtnIrbType` | 数値 | 院内/外部（choice の整数値） |
| `ownerName` | `CtnOwnerName` | 1行テキスト | 設置者の名称 |
| `address1` | `CtnAddress1` | 1行テキスト | — |
| `address2` | `CtnAddress2` | 1行テキスト | — |
| `active` | `CtnActive` | はい/いいえ | — |

## CtnGaiji

**表示名**: CTN 外字確認履歴　**対応する型**: `GaijiRecord`

外字置換マッピングの確認履歴（医師単位）。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| (表示名) | `Title` | 1行テキスト | 既定列。originalChar → replacementChar を組み立てて入れる |
| `doctorId` | `CtnDoctor` | 参照 → `CtnDoctors` | — |
| `notificationId` | `CtnNotification` | 参照 → `CtnNotifications` | 任意 |
| `targetColumn` | `CtnTargetColumn` | 1行テキスト | — |
| `originalChar` | `CtnOriginalChar` | 1行テキスト | — |
| `codePoint` | `CtnCodePoint` | 1行テキスト | — |
| `replacementChar` | `CtnReplacementChar` | 1行テキスト | — |
| `gaijiType` | `CtnGaijiType` | 数値 | 外字判定区分 |
| `confirmedBy` | `CtnConfirmedBy` | 1行テキスト | — |
| `confirmedOn` | `CtnConfirmedOn` | 1行テキスト | — |

## CtnAudit

**表示名**: CTN 監査ログ　**対応する型**: `AuditEntry`

全操作の記録。追記専用（更新・削除メソッドを実装しない）。

> 追記専用。リポジトリに更新・削除メソッドを実装していません。

| `types.ts` プロパティ | 内部名 | 型 | 備考 |
| --- | --- | --- | --- |
| `summary` | `Title` | 1行テキスト | 既定列 |
| `at` | `CtnAt` | 1行テキスト | ISO 文字列 |
| `who` | `CtnWho` | 1行テキスト | ユーザー名 |
| `action` | `CtnAction` | 選択肢（create / update / delete / restore / submit / approve / generate-xml） | — |
| `entity` | `CtnEntity` | 1行テキスト | テーブル表示名 |
| `entityRef` | `CtnEntityRef` | 1行テキスト | 対象の識別子 |
| `summary` | `CtnSummary` | 複数行テキスト（プレーン） | 何を・どう変えたか |

## `id` の扱い

ドメイン型の `id` は文字列ですが、SharePoint の項目 ID は数値です。
変換は `sharepointRepository.ts` の境界で完結し、UI へは数値を漏らしません。
そのため各リストに `CtnId` のような列は作りません（`Id` をそのまま使います）。
