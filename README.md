# CTN 治験届システム化

治験届（CTN: Clinical Trial Notification）業務のシステム化。

**現在の状態**: SharePoint 上で稼働するデモに対して、クライアントメンバーから
UX フィードバックを受け付けている段階。

---

## デモサイト（フィードバック受付中）

**クライアントに渡すURL**（SharePoint の枠を隠した表示）

```
https://seventoone.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo/SitePages/Home.aspx?env=Embedded
```

**通常URL**（開発・確認用。サイトの設定やリストへ辿れる）

```
https://seventoone.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo/SitePages/Home.aspx
```

### 触ってもらう前に伝えること

- **初回は `Ctrl+Shift+R`（強制リロード）で開く。** 更新後にブラウザが古い版を
  キャッシュしていることがある（[理由](ctn-spfx/docs/ライブラリ配信の仕組み.md#8-制約とトレードオフ)）
- **右上の「操作ユーザー」で役割を切り替えられる。** 起票担当 → レビュー担当 →
  承認者 → 薬事担当 の順に切り替えれば、1人でワークフロー全体を通せる
- 入力したデータは実際に SharePoint リストへ保存される（消えない）

### アクセスできるようにするには

SharePoint サイトの**メンバー（編集権限）**に追加する。M365 グループではなく
SharePoint グループへ直接追加すると、サイトだけに範囲を限定できる。
手順は [構築・デプロイ手順.md の6章](ctn-spfx/docs/構築・デプロイ手順.md)。

---

## どこを見ればよいか

| 目的 | 場所 |
| --- | --- |
| **デモがどう作られ動いているか知りたい** | **[`ctn-spfx/`](ctn-spfx/)** ← ここが本体 |
| **作業を再開する・引き継ぐ** | **[`ctn-spfx/docs/引き継ぎ.md`](ctn-spfx/docs/引き継ぎ.md)** ← 最初に読む |
| 画面やロジックを直したい | [`demo/app/`](demo/app/) — UI とドメインロジックの単一ソース |
| 業務ルール（採番・期限）を確認したい | [`CLAUDE.md`](CLAUDE.md) — 治験届の採番ツリー原則 |
| 初期の仕様書・XSD 検証を見たい | [`docs-hub/`](docs-hub/) — 参照用（世代が違う点に注意） |
| 過去の資料・旧構想 | [`archive/`](archive/) — **現行の判断材料ではない** |

---

## 1. デモの本体 — SPFx + SharePoint（`ctn-spfx/`）

治験届の起票・レビュー・承認・提出と CTN XML 生成を、**SharePoint の Web パーツ + リスト**で
実装したもの。**Power Apps Premium などの追加ライセンスを必要としない**（Microsoft 365 のみ）。

**→ [`ctn-spfx/README.md`](ctn-spfx/README.md)**

### 主要なドキュメント

| ファイル | 内容 |
| --- | --- |
| [引き継ぎ.md](ctn-spfx/docs/引き継ぎ.md) | **最初に読む。** 現在の状態・踏んだ落とし穴・再開手順。リポジトリを読んでも分からないことだけを書いている |
| [構築・デプロイ手順.md](ctn-spfx/docs/構築・デプロイ手順.md) | **ゼロから組み立て直す手順。** 環境・リスト構築・パッケージ化・デプロイ・権限・外部招待・更新・移行・トラブルシューティング |
| [ライブラリ配信の仕組み.md](ctn-spfx/docs/ライブラリ配信の仕組み.md) | **管理者への登録依頼を繰り返さずに更新できる理由と境界。** 成立の3条件・依頼が要る変更の一覧・判定方法・制約 |
| [IT依頼-これを渡す.md](ctn-spfx/docs/IT依頼-これを渡す.md) | SharePoint 管理者への依頼内容とメール文面 |
| [spfx-methodology.md](ctn-spfx/docs/spfx-methodology.md) | なぜこの方式か、他構成との比較、設計トレードオフ |
| [columns.md](ctn-spfx/provision/columns.md) | 9リスト・列の対応表（自動生成） |

### 構成の要点

**アプリ本体（JS）とマニフェストを別の場所に置いている。** これにより、コード修正は
サイト所有者権限だけで反映でき、SharePoint 管理者への依頼が不要になる。

| 部品 | 置き場所 | 更新に必要な権限 |
| --- | --- | --- |
| アプリ本体（JS・約1.1MB） | サイト内のライブラリ `ClientSideAssets` | **サイト所有者** |
| マニフェスト（`.sppkg`・約13KB） | テナントのアプリカタログ | **SharePoint 管理者** |
| データ（9リスト） | 配置先サイト | サイト所有者 |

データは**届の全体を JSON 1個（`CtnPayload`）で保持し、一覧用に主要項目を昇格列へ投影**する
設計。SharePoint にリスト横断トランザクションが無いため、子データを別リストに分けると
1回の保存が非原子的になり、採番と XML の整合が壊れる。

権限は**4つのサイトグループ**（起票・レビュー・承認・薬事）から解決する。判定の単一ソースは
[`demo/app/src/ctn/permissions.ts`](demo/app/src/ctn/permissions.ts)。

---

## 2. UI・ロジックの単一ソース（`demo/app/`）

React + TypeScript + Vite。**画面とドメインロジックはここが正。**

`ctn-spfx/src/shared/` は `demo/app/src` からの生成物で **Git 管理外**。共有コードを直すときは
`demo/app/src` を編集し、`ctn-spfx` で `npm run sync` する。

```bash
cd demo/app && npm ci && npm test    # 94件
```

単一ソースの所在。

- 採番ロジック: `demo/app/src/ctn/logic.ts`
- 権限判定: `demo/app/src/ctn/permissions.ts`
- リスト定義: `ctn-spfx/provision/ctn-lists.schema.json`
- 業務ルール（採番ツリー原則）: [`CLAUDE.md`](CLAUDE.md)

---

## 3. 参照用の資料

### `docs-hub/` — 初期の仕様書（GitHub Pages で公開）

**公開URL**: https://splaika.github.io/ctn-prototype/ （社内共有用・noindex）

初期の検討段階の仕様書・設計 HTML。**Dataverse 前提だった時期の記述を含む**ため、
実装の根拠にはしない。ただし XSD マッピング・コード表・期限ルールは現在も有効。

詳細は [`docs-hub/README.md`](docs-hub/README.md)。

### `archive/` — 旧構想の資料・CTN 固有でない手順

LP のドラフト、旧構想（Dataverse）の設計文書、開発環境セットアップ手順など。
**現行の判断材料ではない。** 経緯を辿るために残している。

詳細は [`archive/README.md`](archive/README.md)。

---

## クイックスタート

```powershell
git clone https://github.com/splaika/ctn-prototype.git
cd ctn-prototype\ctn-spfx
. .\scripts\node22.ps1     # Node 22 を PATH へ（SPFx 1.21.1 の上限。dot-source が必要）
npm ci
npm run sync               # src/shared/ を生成（Git 管理外なので必須）
npm test                   # 146件
```

そのあと [`ctn-spfx/docs/引き継ぎ.md`](ctn-spfx/docs/引き継ぎ.md) を読む。
