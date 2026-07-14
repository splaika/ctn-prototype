# CTN Suite デモ（治験届管理システム・本番想定UI）

治験届（CTN）の作成・変更・提出を管理する、本番（Power Platform: Dataverse＋モデル駆動アプリ＋プラグイン）を意識したUIデモです。

## 開く

- **公開URL** — 👉 https://splaika.github.io/ctn-prototype/demo/
- **ローカル** — [`index.html`](index.html) をブラウザで開くだけ（CSS/JSを全インラインした自己完結ファイル）

ブラウザ内のダミーデータで動作し、リロードで初期状態に戻ります。

## 試せること

新規届 / 変更届（ロスター操作→異動区分イベント行）/ N回作成 / 終了・開発中止届 / マスタCRUD（外字確認）/ 職務分離（起票者≠承認者）/ XML生成・サブセットXSD検証。詳細は [`app/README`](app) 相当の実装（`app/src/ctn/`）参照。

## ソースと再ビルド

`index.html` はビルド生成物です。ソースは [`app/`](app)（React + TypeScript + Vite）。

```bash
cd app
npm install --ignore-scripts   # keytar のネイティブビルド回避
npm run dev                     # 開発サーバー
npm test                        # サーバー正本ロジックの自動テスト（34件）
npm run build:demo              # ../index.html（この自己完結デモ）を再生成
```

単一ソースは [`app/src/ctn/ctn-schema.json`](app/src/ctn/ctn-schema.json)（14テーブル・154列・16選択肢・サーバーロジック16件）。設計の引き渡しは [`app/docs/CTN_ハンドオフ.md`](app/docs/CTN_ハンドオフ.md)。
