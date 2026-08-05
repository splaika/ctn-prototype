# CTN 治験届システム化 プロトタイプ

治験届 (CTN: Clinical Trial Notification) 業務のシステム化プロトタイプ。

**3つの成果物が同じリポジトリに入っている。** 目的によって見る場所が違う。

| 目的 | 場所 | 状態 |
| --- | --- | --- |
| **実運用可能な実装**（Microsoft 365 のみ・追加ライセンス¥0） | [`ctn-spfx/`](ctn-spfx/) | **実テナントで稼働中**（1.6.0.0） |
| UI・ドメインロジックの単一ソース（React + Vite） | [`demo/app/`](demo/app/) | 開発の起点 |
| 静的な UX モック（初期の合意形成用） | `index.html` / `ctn-ux-react-standalone.html` | 参照用 |

**公開ページ（静的デモ）**: https://splaika.github.io/ctn-prototype/

---

## 1. SPFx + SharePoint 実装（`ctn-spfx/`）

治験届の起票・レビュー・承認・提出と CTN XML 生成を、**SharePoint の Web パーツ + リスト**で
実現したもの。Power Apps Premium などの追加ライセンスを必要としない。

**→ 詳細は [`ctn-spfx/README.md`](ctn-spfx/README.md)**

主要なドキュメント。

| ファイル | 内容 |
| --- | --- |
| [`ctn-spfx/docs/引き継ぎ.md`](ctn-spfx/docs/引き継ぎ.md) | **作業を再開するとき最初に読む。** 現在の状態・踏んだ落とし穴・再開手順 |
| [`ctn-spfx/docs/構築・デプロイ手順.md`](ctn-spfx/docs/構築・デプロイ手順.md) | **ゼロから組み立て直す手順。** 環境・リスト構築・パッケージ化・デプロイ・権限・外部招待・更新・移行 |
| [`ctn-spfx/docs/IT依頼-これを渡す.md`](ctn-spfx/docs/IT依頼-これを渡す.md) | SharePoint 管理者への依頼内容 |
| [`ctn-spfx/docs/spfx-methodology.md`](ctn-spfx/docs/spfx-methodology.md) | なぜこの方式か、設計トレードオフ |

### 構成の要点

**アプリ本体（JS）とマニフェストを分けて配置している。** これにより、コード修正は
サイト所有者権限だけで反映でき、SharePoint 管理者への依頼が不要になる。

| 部品 | 置き場所 | 更新に必要な権限 |
| --- | --- | --- |
| アプリ本体（JS・約1.1MB） | サイト内のライブラリ `ClientSideAssets` | **サイト所有者** |
| マニフェスト（`.sppkg`・約13KB） | テナントのアプリカタログ | **SharePoint 管理者** |
| データ（9リスト・74列） | 配置先サイト | サイト所有者 |

データは**届の全体を JSON 1個（`CtnPayload`）で保持し、一覧用に主要項目を昇格列へ投影**する
設計。SharePoint にリスト横断トランザクションが無いため、子データを別リストに分けると
1回の保存が非原子的になり採番と XML の整合が壊れる。

権限は**4つのサイトグループ**（起票・レビュー・承認・薬事）から解決する。
判定の単一ソースは [`demo/app/src/ctn/permissions.ts`](demo/app/src/ctn/permissions.ts)。

---

## 2. UI・ロジックの単一ソース（`demo/app/`）

React + TypeScript + Vite。**画面とドメインロジックはここが正。**

`ctn-spfx/src/shared/` は `demo/app/src` からの生成物で **Git 管理外**。共有コードを
直すときは `demo/app/src` を編集し、`ctn-spfx` で `npm run sync` する。

```bash
cd demo/app
npm ci
npm test              # 94件
npm run build:demo    # tsc + vite + 単一ファイル化
```

業務の根幹である**治験届の番号ルール（採番ツリー）は [`CLAUDE.md`](CLAUDE.md) に記載**。
ここを誤ると生成 XML の届出回数が誤値になり、30日調査や提出期限の判断を誤る。

- 採番ロジックの単一ソース: `demo/app/src/ctn/logic.ts`
- リスト定義の単一ソース: `ctn-spfx/provision/ctn-lists.schema.json`
- 権限判定の単一ソース: `demo/app/src/ctn/permissions.ts`

---

## 3. 静的 UX モック

初期の合意形成に使った静的デモ。`index.html` を編集して `main` に push すると
1〜2分で公開ページに反映される。

`ctn-ux-react-standalone.html` は**直接編集しない**（ビルド生成物）。ソースは `src/`。

| ファイル | 役割 |
|---|---|
| `src/app.js` | アプリ本体 (画面・データ・コンポーネント) — 編集対象 |
| `src/styles.css` | 全スタイル。色・角丸は冒頭 `:root` のデザイントークンで一元管理 — 編集対象 |
| `src/shell.html` | HTML 骨格 |
| `src/vendor.js` | React/ReactDOM ほかライブラリ — 編集しない |

修正手順: `src/` を編集 → `python tools/build.py` で再組み立て → push。
