# CTN Suite 方式B 方法論 — React + SharePoint(SPFx)

**版**: 1.0(2026-07-17) / **対象読者**: 実装担当(Claude Code 含む)、レビュー担当、クライアント説明の作成者
**関連文書**: 実装手順は [`ctn-spfx-migration-brief.md`](ctn-spfx-migration-brief.md)(以下「実装ブリーフ」)。本書は「なぜこの方式か・従来構成と何が変わり何が変わらないか」を言語化した設計判断の記録である。

---

## 1. 位置づけ

CTN Suite(治験届管理システム)は、これまで次の3層で構築されてきた。

1. **静的プロトタイプ** — `ctn-prototype` ルートの HTML 群(GitHub Pages 公開)
2. **本番想定UIデモ** — `demo/app`: React 18 + TypeScript + Vite の **Power Apps Code App 構成**。`CtnRepository` 抽象で mock ⇄ Dataverse を切替(Dataverse 実装は未実装のプレースホルダ)
3. **本番構想** — Power Platform(**Dataverse + モデル駆動アプリ + プラグイン**)。`ctn-schema.json`(14テーブル/154列/サーバーロジック16件)が設計の単一ソース。SharePoint は文書保管(`sharepoint-design.html`)

本書が定義する**方式B**は、この系譜に対して「2. のUI資産と業務ロジックをそのまま使い、実行基盤を SPFx(SharePoint Framework)、永続化を SharePoint リストに置き換えた**¥0運用版**」を追加するものである。3. の本番構想を置き換えるものではない(§8 成長パス参照)。

## 2. 経緯 — なぜ方式Bか

出発点はライセンス制約である。Power Apps **Code Apps は実行ユーザー全員に Power Apps Premium($20/人/月)が必須**で、per app プラン($5)や pay-as-you-go の対象外。想定規模(約31名)でも年約¥112万が固定費化する。また「1人だけライセンスを持ち他はライセンスなしで同じアプリを使う」運用は多重化(マルチプレクシング)としてライセンス上許されない。

検討した代替案と判断:

| 案 | 年間コスト(31人) | UI再現度 | 判断 |
| --- | --- | --- | --- |
| A. Code Apps + Premium 継続 | 約¥112万 | 100% | 追加開発ゼロだが固定費が重い |
| **B. React + SharePoint(SPFx)** | **¥0** | **ほぼ100%** | **採用**。資産流用最大・全員入力可 |
| C. Dataverse for Teams(キャンバス再構築) | ¥0 | 70〜80% | UI全面作り直し(3〜4週)。Power Fx で CTN の複雑UIは再現困難 |
| D. 1人ライセンス + 閲覧配信 | 約¥1〜4万 | 入力者のみ100% | 全員入力の要件を満たさない |

CTN Suite は目標管理アプリと異なり、詳細画面の横並びタブ・全154列の入力UI・ウィザード・ロスター操作・XMLプレビュー等の**高密度UI**を持つ。キャンバスアプリ(C案)での再現は工数・品質の両面で非現実的であり、React 資産を無傷で運べる方式Bの優位が特に大きい。

## 3. 全体アーキテクチャ(Before / After)

```
【従来: Code App 構成(demo/app)】            【方式B: SPFx 構成】

Power Apps ホスト(要 Premium)                SharePoint ページ / Teams タブ(M365のみ)
  └ PowerProvider(getContext 待ち)             └ SPFx Web パーツ「CtnSuite」
     └ React 18 アプリ                             └ React 17 アプリ(同一コンポーネント)
        └ CtnRepository(抽象)                        └ CtnRepository(抽象・同一契約)
           ├ MockCtnRepository                          ├ MockCtnRepository(同一・既定)
           └ DataverseCtnRepository                     └ SharePointCtnRepository(新規)
             (全メソッド throw の雛形)                     └ SharePoint リスト×9
                                                             届=集約JSON+昇格列 / マスタ=フラット列
```

認証は Entra ID → SharePoint のユーザーコンテキストで自動解決され、アプリ側の実装はゼロ。`spHttpClient` が要求ダイジェスト等を処理する。

## 4. 従来構成との比較(総覧)

| 観点 | 従来(Code App / Dataverse 構想) | 方式B(SPFx / SharePoint) |
| --- | --- | --- |
| 実行基盤 | Power Apps ホスト | SharePoint ページ / Teams タブ |
| エンドユーザーライセンス | Premium $20/人/月 | **M365 のみ(¥0)** |
| React | 18 | **17(SPFx GA 制約。1.24 で 18 予定)** |
| ビルド | Vite | SPFx ツールチェーン(+ Vite ハーネス温存) |
| 認証 | PowerProvider + SDK | pageContext(実装ゼロ) |
| データ正本 | Dataverse 14テーブル(構想) | SharePoint リスト9本(届=集約JSON) |
| サーバー正本(二層検証) | プラグインで強制(構想) | **クライアント集約 + 楽観ロックで緩和(§6)** |
| 監査 | Dataverse 監査(構想) | CtnAudit リスト + 版管理 |
| 権限 | セキュリティロール(構想) | SharePoint サイト/リスト権限 |
| トランザクション | Dataverse(単一組織内で保証) | **無し → 集約JSONで1書き込みに集約** |
| デプロイ | `power-apps push` | `.sppkg` → アプリカタログ |
| ローカル実行 | Vite dev サーバー | ローカルWorkbench無し → Vite ハーネスで代替 |
| テスト | Vitest 34件 | **同一(無変更)** + リポジトリ単体テスト追加 |
| XML生成/XSD検証・i18n・テーマ・localStorage | クライアント純粋関数ほか | **同一(無変更)** |

以下、判断を要した論点を個別に詳述する。

## 5. データ層の方法論 — 正規化をやめ「集約JSON」にした理由

従来構想は `ctn-schema.json` の14テーブルを Dataverse に正規化配置し、リレーション16本で結ぶものだった。方式Bでは**この正規化を SharePoint に持ち込まない**。

1. **ドメインモデルが既に集約である。** `types.ts` の `Notification` は51のスカラー項目に加え `studyDrugs` / `sites`(医師ロスター・数量を内包)/ `attachments` / `references` / `inquiries` を子配列として抱え、`CtnRepository.updateNotification(n)` は集約全体の置換を契約とする。UI もこの契約の上に成立している。
2. **SharePoint にはリスト横断トランザクションが無い。** 子要素を複数リストへ分割すると、1回の「届の保存」が複数の非原子的書き込みに分解され、途中失敗で採番・XML生成の前提が壊れる。集約JSONなら保存は常に**1アイテム1書き込み=原子的**。
3. **版管理がそのまま「届のスナップショット履歴」になる。** リストのバージョン管理を有効化すれば、集約全体の変化が版として残る。

結果、リスト構成は次の9本(実装ブリーフ§4に列定義):

- `CtnNotifications` — 昇格列(種別・回数・状態・成分参照など一覧/集計用の投影)+ `CtnPayload`(集約JSON・正本)+ `CtnPayloadVersion`
- `CtnCompounds` / `CtnSponsors` / `CtnInstitutions` / `CtnDoctors` / `CtnSiteStaff` / `CtnIrbs` — `types.ts` を1:1でフラット列化(論理削除は Yes/No 列)
- `CtnGaiji` / `CtnAudit` — 履歴系(CtnAudit は追記専用)

`ctn-schema.json` の役割は変わらない: 動的必須(`requiredByType`/`requiredMatrix`)・選択肢・「要確認」バッジは引き続きスキーマ駆動でUIを制御する。**変わるのは物理格納だけ**であり、14テーブル設計は本番(Dataverse)構想の資産として温存される。

留意点: 昇格列は投影であって正本ではない。保存時に Payload と昇格列を**同一の書き込み**で更新することを規約とする(実装ブリーフのチェックリスト参照)。日付は TZ ずれ回避のため SharePoint 日付型を使わず `YYYY-MM-DD` 文字列で保持する。

## 6. 二層検証(サーバー正本)の方法論 — 最大の設計トレードオフ

`CTN_ハンドオフ.md` の核心は「クライアント=提案のみ、確定=サーバー」であり、本番構想では serverLogic 16件(採番2類型・届出区分再計算・職務分離・提出ゲート・外字検出・バイト数検証・期限算定・30日調査判定 等)をプラグインが強制する。**SPFx はブラウザ内でのみ実行されるため、この意味での「サーバー」は存在しない。** 方式Bはこれを認識した上で採用する。

### 強制ポイントの移動

| ロジック | 従来構想の強制点 | 方式Bの強制点 |
| --- | --- | --- |
| 採番(突合キー型/イベント行型/数量継承) | プラグイン | リポジトリ層(`logic.ts`)+ **提出時の etag リトライループ** |
| 職務分離(起票者≠承認者) | プラグイン | リポジトリ層 + actor を pageContext から取得(自己申告にしない) |
| 提出ゲート(承認済のみ提出可) | プラグイン | リポジトリ層の状態遷移検証 |
| 外字検出・バイト数検証 | プラグイン | リポジトリ層(既存純粋関数) |
| 期限・30日調査・区分推奨 | プラグイン + PCF | 既存どおり `logic.ts` / `derive.ts`(表示・保存の両方で再計算) |

### 緩和策(方式Bの規律)

1. **書き込み経路の一本化** — コンポーネントからの直接 REST 呼び出しを禁止し、全書き込みを `SharePointCtnRepository` に集約。保存・承認・提出で `logic.ts` の検証を必ず再実行する
2. **楽観的同時実行制御** — 更新は取得時 etag の `IF-MATCH`(`*` 禁止)。412 は再取得して競合提示。特に**提出時の順序番号確定**は「同一シリーズの最新届を再取得→再計算→etag付き書き込み→412ならリトライ」で衝突を排除する(過去に採番衝突バグの前歴があるため受け入れ基準に含める)
3. **リスト直編集の残余リスク** — サイト権限を持つ利用者は SharePoint 標準UIからリストを直接編集でき、アプリの検証を迂回しうる。運用で緩和: リストをサイトナビゲーションから隠す/編集権限を利用メンバーに限定/版管理で事後検知。厳密な強制が必要になった時点が Dataverse 移行(§8)の判断トリガーである
4. **将来の強化オプション(スコープ外)** — Power Automate(SharePoint は標準コネクタのため追加費用なし)による承認フロー・提出後のアイテム権限ロック

この整理により、方式Bは「二層検証の**運用検証版**(強制は緩いが業務は回る)」、Dataverse 本番は「二層検証の**完全版**」という一貫した物語になる。クライアント説明でもこの語彙を用いること。

## 7. 開発・テスト・デプロイの方法論

### 7.1 リポジトリ体制と同期

- **`ctn-prototype`(既存)= 単一ソース。** `demo/app` は無変更を維持し、GitHub Pages デモ(`npm run build:demo`)と Vitest 34件を壊さないことを全フェーズの受け入れ基準とする
- **本リポジトリ(`ctn-spfx`)= SPFx 側。** 共有コード(`ctn/` 一式・`i18n.ts`・`index.css`・`App.tsx`)は同期スクリプト `scripts/sync-from-demo.mjs` で取り込む(取込先ファイルには「手編集禁止・再同期で上書き」ヘッダーを自動挿入)。同期元パスは引数/環境変数で指定し、既定は隣接クローン `../ctn-prototype/demo/app/src`

### 7.2 React 17 制約

SPFx は SharePoint Online 本体と同じ React に固定され、現行 GA は React 17(React 18 対応は SPFx 1.24 で提供予定・未GA)。方式Bでは `react@17.0.1` を `--save-exact` で固定し、SPFx 側エントリは `ReactDOM.render` を使う。共有コードは React 17/18 両対応の API のみ使用する規律とし(`useId` / `useSyncExternalStore` / `createRoot` 依存の禁止)、`demo/app` 側は React 18 のまま変えない。SPFx 1.24 GA 後にピン留めを更新すればこの制約は消える。

### 7.3 ローカル実行

SPFx にローカル Workbench は無い(実表示確認は実テナントの Hosted Workbench が必要)。方式Bでは **Vite ハーネス(`demo/app` の `npm run dev` + mock)を視覚確認手段として維持**し、テナント無しで UI 開発を完結させる。テナントが必要なのは最終の表示確認と実リスト疎通のみ。

### 7.4 テスト

- 既存 `logic.test.ts` 34件は無変更で通し続ける(ドメインの回帰防止)
- 新規: `spHttpClient` をモックした `SharePointCtnRepository` の単体テスト — 集約JSONの往復同値性、etag 付き MERGE、412→リトライの採番衝突、職務分離違反の拒否、承認前提出の拒否、監査追記

### 7.5 デプロイと ALM

`gulp bundle --ship` → `gulp package-solution --ship` → `.sppkg` をテナントの**アプリカタログ**へ(SharePoint 管理者権限が必要 — クライアント環境では IT 部門との調整ポイント)。サイトへのアプリ追加、単一パーツのアプリページ配置、`provision/provision-lists.ps1`(PnP.PowerShell)によるリスト作成、Web パーツプロパティで `dataSource: sharepoint` へ切替、任意で Teams タブ追加。更新時は**バージョンを上げないと反映されない**キャッシュ特性に注意。

## 8. 成長パス — ¥0版と本番構想の関係

方式Bは行き止まりではない。`CtnRepository` 抽象のおかげで、将来 Dataverse 本番(プラグインによる完全な二層検証・14テーブル正規化・Dataverse 監査)へ進む場合も **UI・ロジック・テストは無傷**で、差し替わるのはリポジトリ実装のみである。`ctn-schema.json` と既存 SharePoint 文書設計(Source PDFs / Attachments / Generated Outputs ライブラリ)はそのとき正式に稼働する。

推奨ストーリー: **方式Bで¥0運用を開始し業務適合を実証 → 規制対応・強制力・監査要件が本格化した段階で Dataverse 本番へ**。移行判断のトリガー例: リスト直編集の統制が運用で維持できない/監査証跡に改ざん防止性が要求される/利用が31名を大きく超え権限が複雑化する。

## 9. リスク台帳

| リスク | 影響 | 緩和 |
| --- | --- | --- |
| 採番の同時実行衝突 | 届出回数・順序番号の重複 | 提出時 etag リトライループ(受け入れ基準) |
| リスト直編集による検証迂回 | 不正な状態のデータ混入 | リスト隠蔽・権限限定・版管理で検知。恒久策は Dataverse 移行 |
| React 17 制約 | 18専用APIの混入でビルド失敗/silent failure | `--save-exact` 固定 + 禁止APIの grep を CI 相当で実施 |
| アプリカタログ承認の遅延 | デプロイ待ち | 早期に IT 部門へ `.sppkg` 配布プロセスを打診 |
| Payload 肥大 | 一覧取得の遅延 | 現規模(数百件)は問題なし。閾値超過時は `$select` 分離・ページング |
| Payload スキーマ変化 | 旧データの読込不能 | `CtnPayloadVersion` + リポジトリ内マイグレーション |
| SPFx 1.24 での React 18 移行 | 二重メンテ | ピン留め更新のみで追随できる構成(共有コードは両対応) |

## 10. 採用判断チェックリスト(クライアント展開時)

- 利用者は全員 M365(SharePoint 利用権)を保有しているか
- 治験届データを SharePoint サイトに置くことが情報区分ポリシー上許容されるか
- 「強制はアプリ層・証跡は版管理」の水準で監査要件を満たせるか(満たせないなら Dataverse 本番へ)
- アプリカタログへの `.sppkg` 登録プロセスが存在するか
- 将来の Dataverse 移行トリガー(§8)を関係者と合意したか
