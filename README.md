# CTN 治験届システム化 プロトタイプ

治験届 (CTN) 業務のシステム化プロトタイプ (静的デモ)。

**公開ページ**: https://splaika.github.io/ctn-prototype/

## ドキュメント

- [CLAUDE.md](CLAUDE.md) — 治験届の採番ツリー原則（業務の根幹ロジック）。作業前に必読
- [docs/dev-environment-setup.md](docs/dev-environment-setup.md) — 開発環境セットアップ（Azure DevOps × VS Code × Claude Code）。**別PC・別アカウントで作業を始めるときはここから**
- [demo/IMPLEMENTATION.md](demo/IMPLEMENTATION.md) — CTN Suite（本番想定UIデモ）の設計・実装記録

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
