# ctn-spfx — Claude Code エントリポイント

## 作業を再開するときは、まず引き継ぎメモを読む

> **[`docs/引き継ぎ.md`](docs/引き継ぎ.md)**
>
> 実装（Phase 0〜4）とロール別権限・差し戻しは完了。**1.6.0.0 が実テナント
> （seventoone）で稼働中**で、通常URLでの書き込みも成立している。
>
> 配信方式は **ライブラリ配信**（`includeClientSideAssets: false` + `cdnBasePath`）。
> コード修正は `ClientSideAssets` ライブラリへのファイル差し替えだけで反映でき、
> **アプリカタログへの再登録（＝IT 依頼）は不要**。マニフェストを変える変更だけが
> 依頼の対象。
>
> 実テナントで踏んだ不具合の根本原因（**OData v3/v4 記法の取り違え** —
> etag が `@odata.etag` に載るのを `odata.etag` と読んでいた）、踏んだ落とし穴、
> 再開手順がそこにまとまっている。
> **リポジトリを読んでも分からないことは、あのファイルにしか書いていない。**

## 環境（最初にこれをやる）

**Node 22 が必須**（SPFx 1.21.1 の上限。開発機の既定は v24 で動かない）。

```powershell
. .\scripts\node22.ps1   # dot-source（先頭のピリオド）が必要
```

**クローン直後は `src/shared/` が存在しない**（生成物・Git 管理外）。同期する。

```bash
npm ci && npm run sync
```

同期せずに `npm test` / `npm run package` を実行すると `scripts/check-shared.mjs`
が理由と対処を示して止める。

## 読む順序(必須)

1. `docs/引き継ぎ.md` — 現在の状態と再開手順（上記）
2. `../CLAUDE.md` — 治験届の採番ツリー原則(業務の根幹。誤ると届出回数が誤値になる)
3. `../demo/app/docs/CTN_ハンドオフ.md` — ドメイン仕様・間違えやすい4ロジック
4. `docs/spfx-methodology.md` — 方式Bの設計判断(集約JSON・二層検証のトレードオフ・React 17)
5. `docs/ctn-spfx-migration-brief.md` — 元の実装ブリーフ（実装済み。経緯の参照用）

## 絶対条件(要約 — 詳細はブリーフ)

### 共有コードの単一ソース（2名以上で作業するとき最も事故る箇所）

- **`src/shared/**` は生成物。絶対に直接編集しない。** 次の `npm run sync` で消える
- 共有コード（画面・ロジック・型）を直すときは **`../demo/app/src` を編集して
  `npm run sync`** する。`src/shared/` は Git 管理外なので、編集してもコミットできない
- `../demo/app` を変更したら `npm test`(94件)と `npm run build` の通過を必ず確認する
- `App.tsx` を変更したら SPFx 側の `src/webparts/ctnSuite/CtnApp.tsx` へ反映が必要か
  確認する（sync がハッシュで検知して止める。確認・反映後に `--accept-app-drift`）

### アーキテクチャ

- コンポーネントは `CtnRepository` のみに依存。ドメインロジック(`logic.ts` 等)の
  再実装・複製禁止
- **権限判定の単一ソースは `../demo/app/src/ctn/permissions.ts`。** UI とリポジトリ層が
  同じ関数を参照する。可否の表は `permissions.test.ts` に写してあるので、仕様を
  変えるときはテストも動かす
- 更新の `IF-MATCH` は実 etag(`*` 禁止)。提出時の採番は再取得→再計算→412リトライ
- 届は集約JSON(`CtnPayload`)+昇格列を同一書き込みで更新。日付は文字列保持。
  **`Notification` にフィールドを足しても SharePoint の列追加は不要**（JSON に入る）
- Web パーツ既定は `dataSource: mock`。React は 17 を `--save-exact` 固定
- **SPFx は OData v4。** 応答の etag は `@odata.etag`、Accept は `odata.metadata=minimal`、
  型指定は `@odata.type`。v3 記法(`odata=nometadata` / `__metadata`)は使わない。
  ただし `provision/browser-*.js` は素の fetch なので v3 記法で正しい（サーバーが
  `OData-Version` の無い要求を v3 とみなすため）

### リリース

- **`solution.version` はリリースのたびに上げる。** 固定するとどの版が動いているか
  判別できない
- **バンドル名のハッシュ固定（`gulpfile.js`）を外さない。** 外すとマニフェストの
  参照先が毎回変わり、ライブラリ配信の前提が壊れて IT 依頼が復活する
- **`.sppkg` を渡す前に中身を検証する。** `release/` の残骸が混入して古いバンドルを
  指す事故が起きうる（手順は引き継ぎメモ 7 章）
- **`cdnBasePath` はテナント固有。** クライアント SPO へ移すときは書き換えて
  `.sppkg` を作り直す

## 実データの確認

`CtnPayload` は届の集約全体を JSON 1個で持つため、SharePoint のリスト画面では
読めない。`provision/browser-inspect.js` をブラウザのコンソールに貼って使う。

```
await ctn.checkAll()    昇格列と CtnPayload の整合を全件検証（投影のズレ検出）
await ctn.get(61)       CtnPayload を展開表示
await ctn.setupViews()  9リストの既定ビューを読める構成に揃える
```
