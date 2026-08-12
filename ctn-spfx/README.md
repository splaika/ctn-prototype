# ctn-spfx — CTN Suite 方式B(React + SharePoint / SPFx)

治験届管理システム **CTN Suite** を、追加ライセンス¥0(Microsoft 365 のみ)で運用するための
**SPFx Web パーツ + SharePoint リスト**実装リポジトリ。

- 本フォルダ `ctn-spfx/` は `ctn-prototype` リポジトリ内に同梱
- UI・ドメインロジックの単一ソースは同リポジトリの [`demo/app`](../demo/app)
- 本フォルダは SPFx 側の実装・プロビジョニング・ドキュメントを保持する

## デモサイト（フィードバック受付中）

**クライアントに渡すURL**（SharePoint の枠を隠した表示）

```
https://seventoone.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo/SitePages/Home.aspx?env=Embedded
```

**通常URL**（開発・確認用）

```
https://seventoone.sharepoint.com/sites/ClinicalTrialSubmissionAssistant-Demo/SitePages/Home.aspx
```

初回は `Ctrl+Shift+R` で開く（キャッシュ対策）。右上の「操作ユーザー」で4つの役割を
切り替えられるので、1人でワークフロー全体を通せる。

## 状態（2026-08-04）

**実テナント（seventoone）で 1.6.0.0 が稼働中。** 通常URLでの読み書きが成立している。

| 項目 | 状態 |
| --- | --- |
| 実装（Phase 0〜4） | 完了 |
| ロール別の権限制御・差し戻し | 完了 |
| 配信方式 | **ライブラリ配信**（コード修正は IT 依頼不要） |
| アプリカタログ | 1.6.0.0 登録済み |
| テスト | ctn-spfx 146件 / demo/app 94件 |

対象サイトはステージング。クライアントメンバーを招いて UX 検証し、修正が固まったら
クライアントの SPO に構築し直す。

## 構成（3つの部品と更新経路）

**JS をパッケージに同梱しない構成のため、コード修正は自分で反映できる。**
マニフェストを変える変更だけが SharePoint 管理者への依頼になる。

| 部品 | 置き場所 | 更新に必要な権限 |
| --- | --- | --- |
| アプリ本体（JS・約1.1MB） | サイト内のライブラリ `ClientSideAssets` | **サイト所有者** |
| マニフェスト（`.sppkg`・約13KB） | テナントのアプリカタログ | **SharePoint 管理者** |
| データ（9リスト・74列） | 配置先サイト | サイト所有者 |

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [`docs/引き継ぎ.md`](docs/引き継ぎ.md) | **最初に読む。** 現在の状態・踏んだ落とし穴・再開手順。リポジトリを読んでも分からないことだけを書いている |
| [`docs/構築・デプロイ手順.md`](docs/構築・デプロイ手順.md) | **ゼロから組み立て直す手順。** 環境構築・リスト構築・パッケージ化・デプロイ・権限・外部招待・更新フロー・移行・トラブルシューティング |
| [`docs/ライブラリ配信の仕組み.md`](docs/ライブラリ配信の仕組み.md) | **管理者への登録依頼を繰り返さずに更新できる理由と、その境界。** 成立の3条件・依頼が要る変更の一覧・依頼を避けて機能追加する手法・判定方法・制約 |
| [`docs/IT依頼-これを渡す.md`](docs/IT依頼-これを渡す.md) | SharePoint 管理者への依頼内容（渡すのは `.sppkg` 1ファイルだけ） |
| [`docs/spfx-methodology.md`](docs/spfx-methodology.md) | **方法論**: なぜ方式Bか、従来構成との比較、設計トレードオフ |
| [`docs/ctn-spfx-migration-brief.md`](docs/ctn-spfx-migration-brief.md) | 実装ブリーフ（実装済み。経緯の参照用） |
| [`docs/sharepoint-db-design-notes.md`](docs/sharepoint-db-design-notes.md) | SharePoint をデータベースとして使う際の設計メモ |
| [`provision/columns.md`](provision/columns.md) | 9リスト・74列の対応表（自動生成） |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code のエントリポイント（読む順序と絶対条件） |

## クイックスタート

```powershell
git clone https://github.com/splaika/ctn-prototype.git
cd ctn-prototype\ctn-spfx
. .\scripts\node22.ps1     # Node 22 を PATH へ（dot-source が必要）
npm ci
npm run sync               # src/shared/ を生成（Git 管理外なので必須）
npm test                   # 146件
```

**`src/shared/` は `demo/app/src` からの生成物で Git 管理外。** 直接編集しても
次の同期で消える。共有コードを直すときは `demo/app/src` を編集して `npm run sync` する。
同期していない状態で `npm test` / `npm run package` を実行すると理由を示して止まる。

## よく使うコマンド

```bash
npm run sync               # demo/app から共有コードを同期
npm test                   # vitest 146件
npm run verify:scope       # 生成CSSが .ctnApp から漏れていないか
npm run package            # .sppkg + release/assets を生成（先に掃除する）
npm run provision:gen      # columns.md と provision-lists.ps1 を再生成
npm run provision:browser  # browser-setup.js と browser-seed.js を再生成
```

## 更新の流れ

**コードのみの修正（IT 依頼不要）**

```bash
rm -rf release dist temp lib sharepoint && npm run package
```

`release/assets/` の3ファイルを `ClientSideAssets` ライブラリへ上書きアップロード。
`solution.version` は上げない（上げると `AppManifest.xml` が変わり再登録が必要になる）。

**マニフェストを変える修正（IT 依頼が必要）**

Web パーツの追加・名称変更・プロパティ既定値・配置許可・プロパティペインの文言・
API 権限要求・`cdnBasePath`・SPFx のバージョンアップ。

判定はビルド後にパッケージを展開して前回と `diff` する。手順は
[`docs/構築・デプロイ手順.md`](docs/構築・デプロイ手順.md) の7章。

## 位置づけ

1. Code Apps 構成は全ユーザーに Power Apps Premium が必要 → 方式Bは **M365 のみで全員入力可**
2. React UI・採番/期限/XML生成ロジック・テストを**無傷で流用**（データ層のみ SharePoint 実装に差し替え）
3. 本番構想(Dataverse + プラグイン)を置き換えない**¥0運用検証版**。移行パスは方法論 §8 参照
