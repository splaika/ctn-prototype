# CTN Suite — SPFx Web パーツ 運用手順

治験届管理システム **CTN Suite** を SharePoint Online 上で動かすための SPFx Web パーツです。
追加ライセンス ¥0（Microsoft 365 のみ）で、UI・ドメインロジック・テストを
[`demo/app`](../demo/app) から流用し、データ層だけ SharePoint リスト実装に差し替えています。

---

## 1. 前提環境

| 項目 | バージョン | 備考 |
| --- | --- | --- |
| SPFx | **1.21.1** | gulp ベースの最終版。1.22 以降は Heft へ移行しており手順が変わる |
| Node.js | **22.x** | `package.json` の `engines` が `>=22.14.0 <23.0.0` を強制。**24 では動かない** |
| React | **17.0.1（完全固定）** | SPFx はバージョン不一致で silent failure を起こす。`--save-exact` を外さないこと |
| TypeScript | 5.3.x | rush-stack-compiler-5.3 |

Node が 24 以外に固定できない環境では [fnm](https://github.com/Schniz/fnm) 等で併存させます。

```bash
fnm install 22
fnm exec --using=22 -- npm install
```

## 2. セットアップ

```bash
npm install
npm run sync
```

`npm run sync` が単一ソース `demo/app/src` から `src/shared/` を生成します。

## 3. ディレクトリの役割

| パス | 手編集 | 内容 |
| --- | --- | --- |
| `src/shared/**` | **禁止** | `sync-from-demo.mjs` の生成物。再同期で上書きされる |
| `src/webparts/ctnSuite/**` | 可 | SPFx ホスト（Web パーツ、CtnApp、ホスト用CSS） |
| `src/data/**` | 可 | SharePoint リポジトリ、REST クライアント、ロール解決 |
| `provision/ctn-lists.schema.json` | 可 | **リスト定義の単一ソース** |
| `provision/columns.md` | **禁止** | `gen-provision.mjs` の生成物 |
| `provision/provision-lists.ps1` | **禁止** | `gen-provision.mjs` の生成物 |

### 単一ソースの原則

- **ドメインロジック**は `demo/app/src/ctn/logic.ts` が正。採番・職務分離・提出ゲートは
  必ずこれを import する。SPFx 側で再実装しない
- **リスト定義**は `provision/ctn-lists.schema.json` が正。対応表・プロビジョニング・
  リポジトリの列名がすべてここから導かれる

## 4. コマンド

```bash
npm run sync            # demo/app から共有コードを取り込む
npm run verify:scope    # 生成CSSが .ctnApp スコープから漏れていないか検査
npm run provision:gen   # columns.md と provision-lists.ps1 を再生成
npm test                # SharePoint リポジトリのユニットテスト（vitest）
npm run build           # gulp bundle
npm run package         # gulp bundle --ship && gulp package-solution --ship → .sppkg
```

`demo/app` を変更したら `npm run sync` を実行します。`App.tsx` が変わっていた場合は
ハッシュ差分で警告が出て停止します。`src/webparts/ctnSuite/CtnApp.tsx` への反映要否を
確認し、済んだら `npm run sync -- --accept-app-drift` で再実行します。

## 5. デプロイ手順

### 5.1 `.sppkg` をアプリカタログへ登録（**SharePoint 管理者権限が必要**）

```bash
npm run package
# → sharepoint/solution/ctn-suite.sppkg
```

この登録だけは**サイト所有者権限では実行できません**。技術的な難易度ではなく組織的な前提です。
IT 部門へ依頼する場合、以下を伝えれば足ります。

> - 対象: SharePoint Online のテナント アプリ カタログ
> - 作業: 添付の `ctn-suite.sppkg` をアップロードし「展開」を承認
> - 要求権限: **追加の API アクセス許可を要求しません**
>   （`package-solution.json` に `webApiPermissionRequests` がありません）。
>   サインインユーザー自身の権限で、配置先サイト内のリストを読み書きするだけです
> - 影響範囲: **サイト単位**。`skipFeatureDeployment` を `false` にしてあるため、
>   承認後もサイト所有者が明示的に「アプリを追加」したサイトでしか使えません。
>   承認と同時に全サイトへ配置されることはありません
> - 分離ドメイン: 使用しません（`isDomainIsolated: false`）

代替として**サイトコレクション アプリ カタログ**があれば、サイト所有者のまま登録できます。
ただしその作成自体にテナント管理者権限が必要です。

### 5.2 サイトへアプリを追加

対象サイト（例: `https://<tenant>.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo`）で
「サイト コンテンツ」→「アプリを追加」→ CTN Suite。

### 5.3 リストを作る

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
cd provision
.\provision-lists.ps1 -SiteUrl 'https://<tenant>.sharepoint.com/sites/<site>' -ClientId '<Entra アプリID>'
```

冪等です。既存のリスト・列・グループは作り直しません。

> PnP.PowerShell 2.x 以降は対話ログインに Entra ID のアプリ登録が必要です。
> 無い場合は `Register-PnPEntraIDAppForInteractiveLogin` で作成できます（テナント管理者の同意が必要）。

### 5.4 ロールを割り当てる

スクリプトが作る4つのサイトグループへ担当者を追加します。

| グループ | ロール |
| --- | --- |
| CTN 起票担当 | `drafter` |
| CTN レビュー担当 | `reviewer` |
| CTN 承認者 | `approver` |
| CTN 薬事担当 | `regulatory` |

どのグループにも属さないユーザーは最小権限の `drafter` になります。
**承認者は起票者と別の人にしてください**（同一人物だと職務分離チェックで拒否されます）。

### 5.5 ページに配置してデータソースを切り替える

ページを編集して CTN Suite を配置し、プロパティで:

| プロパティ | 既定 | 説明 |
| --- | --- | --- |
| データソース | デモデータ（mock） | 実運用は「SharePoint リスト」へ |
| デモモード | オフ | オンで操作ユーザー切替ドロップダウンを表示（職務分離のデモ用） |
| 表示の高さ | 820px | Web パーツ枠の高さ |

既定が mock なのは、リスト未作成のサイトに置いても白画面にならないようにするためです。

### 5.6（任意）Teams タブとして追加

`supportedHosts` に `TeamsTab` を含めています。Teams のチャネルにタブとして追加できます。

## 6. mock と SharePoint の違い

| | mock | SharePoint |
| --- | --- | --- |
| データ | `seed.ts` のデモデータ | リストに永続化・全員で共有 |
| リロード | 初期状態に戻る | 保持される |
| 操作ユーザー | デモユーザー4名（切替可） | サインインユーザー |
| ロール | デモユーザーの属性 | サイトグループ所属から解決 |

## 7. 二層検証の位置づけ（重要）

`CTN_ハンドオフ.md` の設計原則は「クライアントは提案のみ・確定はサーバー」ですが、
**SPFx はクライアント実行のみ**です。この ¥0 構成では採番・職務分離・提出ゲートの強制が
ブラウザ内のリポジトリ層で行われます。意図的に受け入れたトレードオフであり、以下で緩和しています。

1. **全書き込みをリポジトリ層に集約**。保存・承認・提出時に `logic.ts` の検証・採番・
   ゲートを必ず再実行する（コンポーネントから直接 REST を呼ばない）
2. **楽観的同時実行制御**。更新は実 etag の `IF-MATCH` を使う（`*` は使わない）。
   提出時の順序番号確定は「最新を再取得 → 再計算 → etag 付き書き込み → 412 ならリトライ」
3. **監査ログ**は追記専用。全リストでバージョン管理を有効化

本番想定の Dataverse + プラグイン構成では `ctn-schema.json` の serverLogic 16件を
サーバー側で強制します（設計はそのまま有効）。本 SPFx 版はその**運用検証版**という位置づけです。

## 8. 既知の制約

- **サーバー側強制ができない**（上記 7 章）。悪意ある利用者はブラウザの開発者ツールから
  リスト API を直接叩けます。性善説で運用する社内デモ・検証用途を想定しています
- **添付ファイルの実体は保存しません**。現状はメタデータのみを集約 JSON に保持します。
  ドキュメントライブラリ連携は将来フェーズ
- **一覧取得は 500 件上限**（`$top=500`）。30ユーザー・数百件規模の想定です。
  超える場合はページングの実装が必要です
- **提出済みアイテムの編集ロックは未実装**。ステータス遷移はリポジトリ層で制御していますが、
  リスト権限としてのロックはかけていません。Power Automate による承認強化とあわせて将来フェーズ
- **他ユーザーの表示名解決を行いません**。監査ログの `who` は、操作者本人以外はログイン名のまま
  記録されます
- **シードデータ投入スクリプトは未提供**。SharePoint モードは空のリストから始まります
  （マスタ管理画面から登録できます）。デモを見せるだけならデータソースを mock にしてください

## 9. トラブルシューティング

| 症状 | 原因と対処 |
| --- | --- |
| ビルドが Node のバージョンで落ちる | Node 22 が必要。`fnm exec --using=22 -- npm run build` |
| 画面が真っ白 | データソースが sharepoint でリスト未作成。`provision-lists.ps1` を実行するか mock に戻す |
| 承認ボタンが出ない | サインインユーザーが「CTN 承認者」グループに入っていない |
| 「職務分離違反」で承認できない | 起票者本人が承認しようとしている。別の承認者で操作する |
| 「競合により3回失敗」と出る | 同じ届を同時編集している。画面を再読み込みして操作し直す |
| SharePoint ページの見た目が崩れた | `npm run verify:scope` で CSS スコープの漏れを確認する |
