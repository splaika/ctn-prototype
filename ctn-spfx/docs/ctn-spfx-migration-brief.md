# 実装ブリーフ: CTN Suite の SPFx + SharePoint リスト移植

> このドキュメントは Claude Code への実装指示書です。対象リポジトリは
> **https://github.com/splaika/ctn-prototype**(治験届 CTN 管理システム)。
> 必ず先にリポジトリ直下の `CLAUDE.md`(届出回数・変更回数の採番ツリー原則)と
> `demo/app/docs/CTN_ハンドオフ.md` を読んでから着手すること。
> 本ブリーフはそれらに「SharePoint 版のデータ層・ホスティング」を追加する位置づけであり、
> ドメインロジックの仕様はリポジトリ内文書が正となる。


> **リポジトリ体制の注記(ctn-spfx 版)**: 本フォルダ `ctn-spfx/` を SPFx 側の作業ディレクトリとする(`ctn-prototype` リポジトリ内に同梱)。
> 本文中の「`spfx/` に新設」は「`ctn-spfx/` 直下」に読み替えること。共有コードの同期元は
> 同リポジトリの `../demo/app/src`(パスは `scripts/sync-from-demo.mjs` の引数で変更可)。
> 方式の背景・設計判断は [`spfx-methodology.md`](spfx-methodology.md) を先に読むこと。

## 1. ゴール

`demo/app/`(React 18 + TypeScript + Vite の Power Apps Code App 構成)を、
**SPFx Web パーツ + SharePoint リスト**で動く永続化版に移植する。

### 目的(背景)

- 現構成の本番案は Power Platform(Dataverse + モデル駆動 + プラグイン)だが、実行ユーザー全員に Power Apps Premium が必要。SPFx + SharePoint 構成なら **M365 ライセンスのみで追加コスト¥0**、約30名が入力・閲覧可能
- 現在の `DataverseCtnRepository` は全メソッドが throw するプレースホルダであり、置き換えても失うものはない
- React UI・ドメインロジック(採番/期限/区分推奨/職務分離/XML生成)・Vitest テスト34件を**無傷で**流用する

### 絶対条件

1. `demo/app` は**単一ソースとして無変更を維持**する(GitHub Pages の `demo/index.html` を再生成する `npm run build:demo` パイプラインを壊さない)。SPFx プロジェクトは新設ディレクトリ `spfx/` に作り、共有コードは同期スクリプトで取り込む
2. コンポーネントは `CtnRepository` インターフェースのみに依存する既存設計を維持し、新実装 `sharepointRepository.ts` を追加する(mock 実装・切替機構は温存)
3. `ctn-schema.json` 駆動の原則を守る(動的必須・選択肢・「要確認」バッジのハードコード禁止)
4. `logic.ts` / `xml.ts` / `derive.ts` / `rules.ts` の純粋関数と `logic.test.ts` は一切変更しない。SharePoint 版でも保存・承認・提出の各操作はリポジトリ層でこれらを必ず経由する

## 2. ソース資産マップ(`demo/app/src/`)

| 資産 | 扱い |
| --- | --- |
| `ctn/components/` 12ファイル(Sidebar/Dashboard/NotificationList/NotificationDetail/CreateWizard/MasterView/GaijiDialog/XmlPreview/ImportView/SettingsView/AuditView/common) | **流用**(ほぼ無修正) |
| `ctn/ctn-schema.json` / `schema.ts` / `types.ts` / `refData.ts` | **流用**(無修正) |
| `ctn/logic.ts` / `xml.ts` / `derive.ts` / `rules.ts` / `logic.test.ts` | **流用**(無修正・テスト継続実行) |
| `ctn/data/repository.ts` | **流用**(切替を Web パーツプロパティ方式に拡張。`import.meta.env` 分岐は SPFx 側エントリでは使わない) |
| `ctn/data/mockRepository.ts` / `seed.ts` | **流用**(mock モードは SPFx 版でも既定) |
| `i18n.ts`(EN/JA、既定JA) | **流用** |
| `index.css`(807行・標準/モダンテーマ・ダークモード) | **流用**(スコープ化の修正のみ、後述) |
| `App.tsx` | **軽微改修**(ユーザーは SPFx コンテキストから取得、デモ用ユーザー切替はデモモード時のみ表示) |
| `main.tsx` / `PowerProvider.tsx` | SPFx 側では使わない(Web パーツクラスが代替)。demo/app 側はそのまま |
| `ctn/data/dataverseRepository.ts` | SPFx 側には持ち込まない(demo/app には残す) |
| `scripts/build-singlefile.mjs` / GitHub Pages デモ | 無変更 |

補足: `localStorage`(テーマ・サイドバー開閉・列順の保持)は SharePoint ページ上で問題なく動作するため**変更不要**。`index.css` に外部フォント読み込みは無い(確認済み)。

## 3. ターゲットアーキテクチャ

```
SharePoint ページ / Teams タブ
  └─ SPFx Web パーツ「CTN Suite」
       └─ React アプリ(既存コンポーネント群 + logic/xml/derive/rules)
            └─ CtnRepository(抽象)
                 ├─ MockCtnRepository(シード、既定)
                 └─ SharePointCtnRepository(spHttpClient / SP REST)
                      ├─ CtnNotifications(届 = 集約1件を JSON ペイロードで保持)
                      ├─ CtnCompounds / CtnSponsors(シリーズ・届出者)
                      ├─ CtnInstitutions / CtnDoctors / CtnSiteStaff / CtnIrbs(マスタ)
                      ├─ CtnGaiji(外字確認履歴)
                      └─ CtnAudit(監査ログ・追記専用)
```

- 認証: 実装不要。`this.context.spHttpClient` がユーザーコンテキストで動作
- 操作ユーザー: `this.context.pageContext.user`(loginName / displayName)を既定の actor とする。既存のユーザー切替ドロップダウンは Web パーツプロパティ `demoMode: boolean` が true のときのみ表示(職務分離のデモ用)
- データソース切替: Web パーツプロパティ `dataSource: 'mock' | 'sharepoint'`(既定 `mock`)
- 言語初期値: `pageContext.cultureInfo` が `ja` 系なら JA(既存の既定と同じ)、アプリ内トグルは維持

## 4. データ設計の中核判断: 届は「集約 JSON」で保存する

**14テーブルへの正規化は行わない。** 理由:

1. `Notification` はドメイン上の集約であり、`studyDrugs` / `sites`(内包する `investigators`・数量)/ `attachments` / `references` / `inquiries` を子配列として抱え、`updateNotification(n)` は集約全体を置き換える契約になっている
2. SharePoint には**リスト横断のトランザクションが無い**。子要素を6リストに分けると1回の保存が非原子的になり、採番・XML生成の整合が壊れる。集約 JSON なら保存は常に1アイテム1書き込みで原子的
3. リストのバージョン管理が「届のスナップショット履歴」としてそのまま機能する

### `CtnNotifications` の列設計

| 内部名 | 型 | 役割 |
| --- | --- | --- |
| `Title` | 1行テキスト | 表示名(例 `ABC-123 届2/変1 変更届`)。保存時にリポジトリが組み立て |
| `CtnCompound` | 参照(`CtnCompounds`) | 一覧の絞り込み用 |
| `CtnNotifType` | 選択肢 | `types.ts` の `NotifTypeKey` の値をそのまま選択肢値に |
| `CtnFilingCount` | 数値 | 届出回数 |
| `CtnChangeCount` | 数値 | 変更回数(計画届等は空) |
| `CtnStatus` | 選択肢 | `draft` / `review` / `approved` / `submitted` |
| `CtnProtocolNo` | 1行テキスト | 実施計画書識別記号 |
| `CtnNoteDate` | 1行テキスト | 届出年月日(`YYYY-MM-DD` 文字列。TZ ずれ回避のため日付型にしない) |
| `CtnCreatedByUser` / `CtnApprovedByUser` | 1行テキスト | loginName(職務分離の判定に使用) |
| `CtnPayload` | 複数行テキスト(プレーン) | **`Notification` 集約全体の JSON**(子配列含む) |
| `CtnPayloadVersion` | 1行テキスト | ペイロードのスキーマ版(将来のマイグレーション用。初期値 `1`) |

昇格列(Payload 以外)は**一覧表示・フィルタ・ダッシュボード集計のための投影**であり、正はあくまで `CtnPayload`。保存時に必ず両方を同時更新する(1回の書き込みなので原子的)。読み取りは `getState()` が全件 `$top=500` で取得し Payload をパースする(30ユーザー・数百件規模で十分)。

### マスタ・その他リスト

`types.ts` のインターフェース(`Compound` / `Institution` / `Doctor` / `SiteStaff` / `Irb` / `Sponsor` / `GaijiRecord` / `AuditEntry`)を**1:1でフラット列に写像**する。規則: プロパティ名を PascalCase 化し `Ctn` プレフィックス(例 `nameKanji` → `CtnNameKanji`)。数値 enum は数値列、文字列 union は選択肢列、日付文字列は1行テキスト。裸の `Level` / `Status` / `Owner` 等の予約名衝突を避けるため**プレフィックスは必須**。論理削除(`active`)は Yes/No 列(物理削除は実装しない — 既存仕様どおり)。

成果物として `spfx/provision/columns.md` に「types.ts プロパティ → リスト列」の完全な対応表を生成し、レビュー可能にすること。

### 監査ログ

`CtnAudit` は作成のみ(更新・削除メソッドを実装しない)。actor は pageContext のユーザーで補完。全リストでバージョン管理を有効化する。

### 添付ファイル(スコープ外・設計整合のみ)

リポジトリ既存の SharePoint 設計書(`outputs/.../docs-html/sharepoint-design.html`: Source PDFs / Attachments / Generated Outputs ライブラリ)は**文書保管**の設計であり、本件のリスト設計と競合しない。現アプリの添付はメタデータのみなので今回は Payload 内に保持し、実ファイル格納(ライブラリ連携)は将来フェーズとして README に記載するに留める。

## 5. 二層検証(サーバー正本)の扱い — 明示的なトレードオフ

`CTN_ハンドオフ.md` の核心は「クライアントは提案のみ・確定はサーバー」だが、**SPFx はクライアント実行のみ**であり、この¥0構成では採番・職務分離・提出ゲートの強制はブラウザ内のリポジトリ層で行うことになる。これは意図的に受け入れるトレードオフであり、以下で緩和する。

1. **全書き込みをリポジトリ層に集約**し、保存・承認・提出時に `logic.ts` の検証・採番・ゲートを必ず再実行する(コンポーネントから直接 REST を呼ぶことを禁止)
2. **楽観的同時実行制御**: 更新は `IF-MATCH: {実 etag}` を使う(`*` を使わない)。412 Precondition Failed 時は最新を再取得して競合をユーザーに提示。**提出時の順序番号確定**(`nextStudyDrugSerial` 等・過去に採番衝突バグの前歴あり)は「最新の同一シリーズ届を再取得 → 再計算 → etag 付き書き込み → 412 ならリトライ」のループで衝突を防ぐ
3. 提出済みアイテムの編集ロックや Power Automate 承認(SharePoint は標準コネクタのため M365 内で追加費用なし)による強化は**将来フェーズ**として README に記載
4. README に「本番の Dataverse + プラグイン構成では serverLogic 16件をサーバー側で強制する(設計は `ctn-schema.json` のまま有効)」と明記し、この SPFx 版が二層検証の**運用検証版**である位置づけを保つ

## 6. `sharepointRepository.ts` 実装ガイド

- `SPHttpClient.configurations.v1`、`Accept: application/json;odata=nometadata`
- 読み取り: `getState()` で9リストを並列 GET(`Promise.all`)、`CtnNotifications` は `Id,Title,...,CtnPayload` を取得し JSON パース。SharePoint の数値 Id は `String()` でドメインの文字列 id に変換し、変換はリポジトリ境界で完結させる(UI へ漏らさない)
- 作成: `POST .../items`。参照列は `CtnCompoundId: <number>`
- 更新: `POST .../items({id})` + `X-HTTP-Method: MERGE` + `IF-MATCH: {etag}`(etag は GET 時に保持)
- `deleteNotification` はドラフトのみ許可(既存仕様を確認して踏襲)。物理削除は `X-HTTP-Method: DELETE`
- ワークフローメソッド(`sendForReview` / `approveNotification` / `submitNotification` / `markXmlGenerated`)は、状態遷移の前提条件(承認済ゲート、起票者≠承認者)を `logic.ts` 側の判定で検証してから書き込む。違反時は mock 実装と同じエラーメッセージ形式で throw(UI のトースト表示互換のため)
- 監査: 各書き込みの後に `CtnAudit` へ追記(mock 実装の付随記録と同じ内容)

## 7. 実装フェーズと受け入れ基準

### Phase 0: 準備

- [ ] リポジトリの `CLAUDE.md`(採番ツリー原則)と `demo/app/docs/CTN_ハンドオフ.md` を通読
- [ ] SPFx 互換性マトリクス(https://learn.microsoft.com/sharepoint/dev/spfx/compatibility)で現行 GA の SPFx / Node / React 対応を確認し `spfx/README-spfx.md` に記録
- [ ] `spfx/` に `yo @microsoft/sharepoint` でスキャフォールド(React テンプレート、Web パーツ名 `CtnSuite`)

### Phase 1: UI 移植(テナント不要)

- [ ] 同期スクリプト `spfx/scripts/sync-from-demo.mjs` を作成: `demo/app/src/{ctn,i18n.ts,index.css,App.tsx}` を `spfx` 側へコピー(App.tsx のみ SPFx 用パッチを適用する構成でも可)。**手編集禁止・再同期で上書きされる旨をヘッダーコメントに自動挿入**
- [ ] React ダウングレード対応: SPFx 現行 GA は React 17 固定(React 18 対応は SPFx 1.24 予定・未GA)。`react@17.0.1` / `react-dom@17.0.1` を `--save-exact` で固定し、SPFx 側エントリは `ReactDOM.render` を使用。共有コードに React 18 専用 API(`useId` / `useSyncExternalStore` / `createRoot` 依存)が無いことを grep で確認し、あれば **demo/app 側も動く形の互換書き換え**を demo/app に対して提案(このケースのみ demo/app 変更可、ただし `npm run build:demo` と `npm test` の通過を必須とする)
- [ ] CSS スコープ化: ルート要素に `.ctnApp` を付与し全セレクタにプレフィックス。テーマ(標準/モダン)・ダークモードのクラス/属性切替が SharePoint ページ内で完結し、ページ側スタイルを汚染しないこと
- [ ] Web パーツプロパティ `dataSource`(既定 `mock`)と `demoMode`(既定 false)を実装。actor を pageContext ユーザーに接続
- **受け入れ基準**: `gulp build` / `gulp bundle` が警告なしで通る。`demo/app` で `npm test`(34件)と `npm run build:demo` が引き続き通る。Vite(`demo/app` の `npm run dev`)で従来どおり全画面の視覚確認ができる

### Phase 2: SharePoint リポジトリ(テナント不要)

- [ ] `sharepointRepository.ts` 実装(セクション4・6準拠)
- [ ] `spHttpClient` をモックしたユニットテストで検証: 集約 JSON の往復(シリアライズ→パースで `seed.ts` の届が同値)、etag 付き MERGE、412→リトライの採番衝突シナリオ、職務分離違反の拒否、承認前提出の拒否、監査追記
- [ ] `spfx/provision/columns.md`(対応表)を生成
- **受け入れ基準**: 上記テスト全通過 + 既存 `logic.test.ts` 34件が無変更で通過

### Phase 3: プロビジョニング(生成のみ、実行は人間)

- [ ] `spfx/provision/provision-lists.ps1`(PnP.PowerShell): 9リスト・全列・選択肢・参照・バージョン管理有効化を冪等に作成
- [ ] `spfx/provision/seed-data.ps1`(任意): `seed.ts` 相当(シリーズ ABC-123、医師5名うち外字1名、機関2、IRB 1、届出者1)を投入
- **受け入れ基準**: スクリプトが `columns.md` と1:1で対応(静的レビュー)

### Phase 4: パッケージングと引き渡し

- [ ] `gulp bundle --ship` / `gulp package-solution --ship` で `.sppkg` 生成。`supportedHosts` に `SharePointWebPart` と `TeamsTab`
- [ ] `spfx/README-spfx.md`: 前提、同期スクリプトの使い方、ビルド、プロビジョニング、デプロイ手順(下記)、mock/sharepoint 切替、二層検証の位置づけ(セクション5)、既知の制約
- **受け入れ基準**: `.sppkg` 生成済み。README だけで第三者がデプロイ可能

### デプロイ手順(README 記載内容、実行は Yasuhiko)

1. アプリカタログへ `.sppkg` をアップロード(SharePoint 管理者権限)
2. 対象サイトにアプリ追加 → 単一パーツのアプリページに Web パーツ配置
3. `provision-lists.ps1` 実行(必要なら `seed-data.ps1`)
4. Web パーツプロパティで `dataSource` を `sharepoint` に切替
5. (任意)Teams タブとして追加

## 8. テナント無しでの到達点

Phase 1〜4 の全成果物(`.sppkg`、テスト済みリポジトリ、プロビジョニングスクリプト、対応表、README)まで実テナント無しで到達可能。Hosted Workbench での表示確認と実リスト CRUD 疎通のみ引き渡し後に実施し、発見事項は Phase 2 テストにケース追加して修正する。

## 9. 落とし穴チェックリスト

- [ ] React を `--save-exact` で固定したか(SPFx はバージョン不一致で silent failure)
- [ ] `demo/app` を壊していないか: `npm test` 34件 / `npm run build:demo` / GitHub Pages デモの3点を毎フェーズ末に確認
- [ ] 採番・区分・期限・XMLロジックを SPFx 側で再実装・複製していないか(必ず `logic.ts` 等を import)
- [ ] `ctn-schema.json` 由来の必須切替・選択肢・要確認バッジをハードコードしていないか
- [ ] 更新に `IF-MATCH: *` を使っていないか(実 etag 必須。採番衝突の温床)
- [ ] リスト列の内部名に `Ctn` プレフィックスを付けたか(予約名衝突回避)
- [ ] 参照列の書き込みで `{内部名}Id` を使っているか
- [ ] `CtnPayload` と昇格列を同一書き込みで更新しているか(別々に更新しない)
- [ ] `import.meta.env` の残骸が SPFx バンドルに無いか
- [ ] Web パーツ既定が `mock` か(リスト未作成のサイトでも白画面にならない)
- [ ] 日付を SharePoint 日付型にしていないか(TZ ずれ回避のため文字列保持の方針)

## 10. 参照

- 対象リポジトリ: https://github.com/splaika/ctn-prototype (`demo/app/` が本体)
- ドメイン正: リポジトリ直下 `CLAUDE.md`、`demo/app/docs/CTN_ハンドオフ.md`、`demo/IMPLEMENTATION.md`
- 既存 SharePoint 文書設計: `outputs/ctn-lp-static-safe-*/docs-html/sharepoint-design.html`
- SPFx 互換性マトリクス: https://learn.microsoft.com/sharepoint/dev/spfx/compatibility
- SP REST(リスト項目 CRUD / etag): https://learn.microsoft.com/sharepoint/dev/sp-add-ins/working-with-lists-and-list-items-with-rest
- PnP.PowerShell: https://pnp.github.io/powershell/
