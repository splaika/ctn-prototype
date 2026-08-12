# docs-hub — 初期の仕様書・設計 HTML（GitHub Pages で公開）

**公開URL**: https://splaika.github.io/ctn-prototype/ （ルートからここへ転送される）

社内共有用・noindex。`index.html` が全体のハブで、各文書へリンクしている。

## 位置づけ

**世代が違う。** ここにある仕様書は初期の検討段階のもので、実装方式が
Dataverse 前提だった時期の記述を含む（`ctn-dataverse-columns.html` の176列など）。

**現行の実装と設計は [`../ctn-spfx/`](../ctn-spfx/)。**

ただし以下は現在も有効な資料。

| 文書 | 内容 |
| --- | --- |
| `ctn-xsd-mapping.html` | CTN XML の要素マッピング138要素 |
| `ctn-xsd-roundtrip.html` | XML生成 → 公式XSD検証の実証記録 |
| `ctn-code-tables.html` | コード表レジストリ（大学番号94件ほか） |
| `ctn-deadline-rules.html` | 変更届の提出期限ルール |
| `ctn-notification-matrix.html` | 届出種別マトリクス |
| `ctn-traceability-hub.html` | URS↔FS↔RA↔OQ の相互リンク（CSV文書一式） |

## `ctn-ux-react-standalone.html` の修正方法

**直接編集しない**（ビルド生成物）。ソースは `src/`。

| ファイル | 役割 |
| --- | --- |
| `src/app.js` | アプリ本体（画面・データ・コンポーネント）— 編集対象 |
| `src/styles.css` | 全スタイル。色・角丸は冒頭 `:root` のデザイントークンで一元管理 — 編集対象 |
| `src/shell.html` | HTML 骨格 |
| `src/vendor.js` | React/ReactDOM ほかライブラリ — 編集しない |

```bash
cd docs-hub
python tools/build.py
```

## 本番想定UIデモとの関係

ハブから「本番想定UIデモ (CTN Suite)」としてリンクしている `../demo/` は、
**現行の UI 単一ソース `demo/app/` のビルド結果**。こちらは生きている。

`docs-hub/ctn-ux-react-standalone.html` は初期の UX モックで、`demo/` とは別物。
