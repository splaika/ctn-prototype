# CTN Suite LP（ドラフト・作業中）

治験届管理システムを紹介するランディングページ。**次セッションで修正継続予定**。

- `index.html` — 自己完結ビルド（画像をdata URIで内包）。ブラウザで開いて確認可。
- `lp.src.html` — 編集用ソース（`{{IMG_DASH}}`/`{{IMG_DETAIL}}` プレースホルダ）。コピー・デザインの修正はこちらを編集。
- `lp2-dash.png` / `lp2-detail.png` — 埋め込み用スクリーンショット。

## ビルド（ソース→自己完結HTML）
`lp.src.html` の `{{IMG_DASH}}`→`lp2-dash.png`、`{{IMG_DETAIL}}`→`lp2-detail.png` を
`data:image/png;base64,...` に置換して `index.html` を生成。

## 現状
- トーン：白／薄グレー基調、差し色＝ミュートのティール `#0f7d74`
- 機能カード5枚、テキストは簡潔版
- Artifact（要ログイン）: https://claude.ai/code/artifact/9ef7d120-e1ae-4d61-b192-89d12047eedc

## 残TODO（次セッション）
- LPのさらなる修正（コピー/配色/構成の詰め）
- システム側の細かい修正（別途）
