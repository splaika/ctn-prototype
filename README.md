# CTN 治験届システム化 プロトタイプ

治験届 (CTN) 業務のシステム化プロトタイプ (静的デモ)。

**公開ページ**: https://splaika.github.io/ctn-prototype/

## 更新方法

`index.html` を編集して `main` に push すると 1〜2 分で自動反映されます。

## UXモック (ctn-ux-react-standalone.html) の修正方法

`ctn-ux-react-standalone.html` は直接編集しない (ビルド生成物)。ソースは `src/` にある:

| ファイル | 役割 |
|---|---|
| `src/app.js` | アプリ本体 (画面・データ・コンポーネント) — 編集対象 |
| `src/styles.css` | 全スタイル。色・角丸は冒頭 `:root` のデザイントークンで一元管理 — 編集対象 |
| `src/shell.html` | HTML 骨格 |
| `src/vendor.js` | React/ReactDOM ほかライブラリ — 編集しない |

修正手順: `src/` を編集 → `python tools/build.py` で再組み立て → push。
