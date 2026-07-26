# SharePoint バックエンド DB 設計 — 検討メモ

**日付**: 2026-07-25（初版）／ 2026-07-26 改訂 / **位置づけ**: [`spfx-methodology.md`](spfx-methodology.md)（方式Bの設計判断）と
[`ctn-spfx-migration-brief.md`](ctn-spfx-migration-brief.md)（実装手順）に対する、**列レベルの具体設計と論点整理**。
方針そのものを変更するものではない。

---

## 1. 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| DB（リスト）設計書 | `outputs/CTN_SharePoint_DB設計_20260725.xlsx` | 11シート。リスト12本・列124件・Payload項目173件 |
| 生成スクリプト | `tools/gen-sharepoint-db-design.py` | `ctn-schema.json` を読んで必須マーク・XSD要素名・選択肢・要確認列を自動で埋める |

再生成: `python tools/gen-sharepoint-db-design.py`

実装ブリーフ §4 が成果物として要求している「`types.ts` プロパティ → リスト列」の完全な対応表
（`provision/columns.md` 相当）を、Excel の `02_列定義` / `03_Payload構造` シートとして満たす。

### シート構成

| シート | 行数 | 内容 |
| --- | --- | --- |
| 00_設計方針 | 33 | アーキテクチャ、中核判断7点、二層検証のトレードオフ |
| 01_リスト一覧 | 15 | 12リスト（既定9＋新規3）の役割・件数・正本/投影 |
| 02_列定義 | 124 | 全リストの内部名・SP型・必須・一意・インデックス・`types.ts` 対応 |
| 03_Payload構造 | 177 | 集約JSONの全項目。150/173 行に必須マーク（計/変/中/終/開）と XSD 要素名を自動突合 |
| 04_リレーション | 20 | Lookup 8本＋集約JSONの入れ子に吸収した9本 |
| 05_選択肢マスタ | 68 | 16セットのコード値と格納先 |
| 06_ロジック実装マップ | 20 | serverLogic 16件 → SharePoint版の実装点・該当関数・強制力 |
| 07_画面データ連携 | 21 | 画面 × 操作 → 読み書きリスト・REST・経由ロジック |
| 08_制限対策 | 18 | SharePoint 固有制約14件と対処 |
| 09_権限・監査 | 16 | 権限設計＋監査証跡3層 |
| 10_要確認事項 | 38 | `status=要確認` の列を自動抽出 |

## 2. 本設計で追加したリスト（`demo/app` に対応する永続化が無いもの）

| リスト | 追加理由 |
| --- | --- |
| `CtnSettings` | `rules.ts` の `RuleSettings` はメモリ内シングルトンでリロード時に既定へ戻る。提出期限のオフセット（30/14日）は全利用者で共有するため永続化が必須。更新は薬事担当ロールに限定する |
| `CtnAppUsers` | 職務分離（起票者≠承認者）の判定にロールが要る。actor は `pageContext` から取れるが、ロールの正本が無いと `canApprove()` が判定できない |
| `CtnAttachmentFiles` | 添付の実ファイル格納。ブリーフ通り将来フェーズ（列定義のみ） |

`CtnNotifications` には `CtnCompoundCode`（非正規化）と `CtnDeadline` / `CtnIs30DayReview`（派生値の昇格）を追加。
SharePoint は Lookup 先の列で絞り込むと 5,000件しきい値に触れやすく、計算列も他リスト参照・`Today` が使えないため。

## 3. 確認した論点（2026-07-25）

### ① 残りの実装の難易度

DB 構築は必要作業の4分の1。UI が実データで動くには以下が要る。

| 項目 | 難易度 | 備考 |
| --- | --- | --- |
| `provision-lists.ps1` | 低 | 本 Excel と1:1 |
| `sharepointRepository.ts` | 中 | `CtnRepository` の27メソッド。REST + etag + 412リトライ。**未着手（ファイル未作成）** |
| SPFx Web パーツ化 | 中（ハマりどころ多） | React 17 固定・CSS スコープ化・gulp |
| `.sppkg` をアプリカタログへ登録 | — | **技術的難易度ではなく組織的前提。SharePoint 管理者権限が必要** |

- React のバージョン不一致は silent failure（白画面）を起こす → `react@17.0.1` を `--save-exact` で固定
- SPFx にローカル Workbench は無い。ただし Vite + mock を視覚確認手段として残せるため、
  **テナント無しでも `.sppkg` 生成まで到達可能**。テナントが要るのは最終疎通確認のみ

### ② PDF 出力（2026-07-26 更新・決着）

> **初版（07-25）の記述の訂正**: 「PDF の生成機能は無い」と記載したが、これは `main` 基準の話であり、
> 未マージのブランチ `claude/ctn-output-pdf-xml` に第一版が存在した。**2026-07-26 に main へマージ済み。**

**実装済みの内容**（commit `97dcb6d`）

- 届出詳細の［提出パッケージ出力］で ① CTN XML ② 届書PDF を生成
- 資料種別「検査キット/パッキングリスト」(値 `100001208`) の実PDFを届書PDFへ結合して1ファイル化
  （デモはサンプルPDFを生成）
- `PrintableNotification.tsx`（印刷ビュー）／`output.ts`（`html2canvas` → `pdf-lib`）
- XML に届書添付資料要素（`DOCATTACHEDNOTE` / `INFONAMEDOCUMENTS` / `NAMEDOC`）を追加
- deps: `pdf-lib`, `html2canvas`

**★用途の切り分け（2026-07-26 確認）**

| | 位置づけ |
| --- | --- |
| **現行の届書PDF** | **社内レビュー用** |
| PMDA への提出正本 | XML（＋添付PDF） |
| 将来 | **PDF 出力は最終的に PMDA へ必須となる見込み** → その段階で方式の見直しが要る |

**現行方式（ラスタライズ）の制約**

1. PDF 内のテキストが選択・検索・コピーできない
2. ページ分割が画像のオフセットずらしのため、表や行がページ境界で切断されうる
3. バンドル増（自己完結デモが約450KB → 約1,081KB）

社内レビュー用途では許容できるが、**提出用途では 1 が問題**になる。

**★設計上の整合性リスク**: `ctn-schema.json` の添付資料テーブルは `cr_hastext`（テキスト含有チェック）と
`cr_hasbookmarks`（しおり付与チェック）を **PMDA の PDF 品質要件**として持つ。
ラスタライズPDFはテキストを含まないため、提出用途へ格上げする際は必ず方式を見直す必要がある。

**提出用途へ格上げする場合の方式比較**

| 方式 | 再現度 | 難点 |
| --- | --- | --- |
| A. 印刷CSS（`@media print` 拡張） | 中 | ユーザー操作が必要・自動保存不可 |
| **B. Word テンプレート + SharePoint のファイル変換（推奨）** | **高** | Power Automate フローの設計が必要・非同期。**標準コネクタのため追加費用なし**。テキスト選択可・日本語フォント問題なしを同時に満たす |
| C. pdfmake / jsPDF + 日本語フォント埋め込み | 中〜高 | Noto Sans JP の埋め込みでバンドルが数MB増。SPFx では割に合わない |

**設計デルタ（すべて追記のみ。既存の列定義・Payload構造は不変）**

1. `CtnNotifications` に `CtnPdfGeneratedAt` を1列追加（`CtnXmlGeneratedAt` と対称）
2. `CtnGeneratedOutputs` ドキュメントライブラリを追加（8列）。既存の SharePoint 文書設計
   （`outputs/ctn-lp-static-safe-*/docs-html/sharepoint-design.html` の
   Source PDFs / Attachments / **Generated Outputs** の3ライブラリ構成）へ寄せる。
   `CtnOutputKind` で `pdf-review`（現行）/ `pdf-submission`（将来）/ `xml` を区別する
3. `06_ロジック実装マップ` に「届書PDF生成」「提出パッケージ結合」の2件を追加（No.17-18）
4. `07_画面データ連携` に「提出パッケージ出力」を追加
5. `08_制限対策` に「クライアント側PDF生成の限界」「バンドルサイズ」を追加
6. `05_選択肢マスタ` の資料種別に `100001208` が自動反映（生成スクリプトが schema を読むため）

**`CtnAttachmentFiles` の段階**: 現行は添付のメタデータのみを Payload に保持し実ファイルを持たない
（デモはサンプルPDFを生成して結合）。**実ファイル結合を本番で行う段階＝提出用途への格上げ時に必須化**する。
社内レビュー用途に留まる限りは将来フェーズのままでよい。

### ③ Dataverse への移行難易度

「アプリは無傷」は事実（差し替わるのはリポジトリ実装1ファイル）。ただし移行プロジェクト全体では別。

| 要素 | 難易度 | 理由 |
| --- | --- | --- |
| UI・`logic.ts` / `xml.ts` / `derive.ts`・Vitest 41件 | 極小 | 変更ゼロ |
| Dataverse テーブル構築 | 小〜中 | `ctn-schema.json` が完成済み。機械的だが量がある |
| `DataverseCtnRepository` 実装 | 中 | 27メソッド。現状は全メソッド `throw` の雛形 |
| データ移行 ETL | 中 | 集約JSON → 14テーブルへ分解。順序番号の整合維持が要注意。**件数が数百〜2,000と少なく一度きり**なのが救い |
| **プラグイン16件（C#）** | **大** | ここが工数の支配項。SharePoint 版の作業とは別物 |
| **CSV / バリデーション文書** | **大** | 技術ではなく規制対応。GAMP Cat 5 が11件、OQ 対象14件 |
| ライセンス調達・組織調整 | 中 | Premium $20/人/月 × 31名 ≒ 年112万円 |

**移行を軽くしている資産**

1. 本 Excel の `03_Payload構造` シートが **ETL のマッピング仕様そのもの**（173項目・うち150項目は
   Dataverse 列名と XSD 要素名を自動突合済み）
2. `logic.test.ts` 41件が両構成で通ることが**回帰保証**になる

**移行トリガーはデータ量より先に統制要件が来る**。`CtnNotifications` は数百〜2,000件想定で
5,000件しきい値には当分届かない（最初に当たるのは `CtnAudit`・年次アーカイブで対処可）。
実際に効くのは「SharePoint 標準UIからのリスト直編集でアプリの検証を迂回できる」という残余リスクのほう。

## 4. 次の着手点

- [ ] `provision-lists.ps1` の生成（本 Excel と1:1対応）
- [ ] `sharepointRepository.ts` の実装＋`spHttpClient` モックの単体テスト
- [x] ~~PDF 出力の要件確定（提出正本か社内記録か）~~ → **社内レビュー用と確定（2026-07-26）**
- [ ] PMDA 提出用PDFの要件確定（テキスト選択可・しおり付与・様式の再現度）と、
      サーバー側生成（方式B: Word テンプレート＋ファイル変換）へ切り替える時期の判断
- [ ] 実ファイル結合の運用開始時期 → その前提となる `CtnAttachmentFiles` の構築時期
- [ ] `.sppkg` 配布プロセスについて IT 部門へ打診（早期に着手すべき組織的依存）

## 5. main へマージした関連ブランチ（2026-07-26）

| ブランチ | 内容 |
| --- | --- |
| `claude/ctn-output-pdf-xml` | 提出パッケージ出力（届書PDF＋CTN XML、Packing List 同梱） |
| `feat/color-palette-variants` | 配色バリエーション（現行インディゴ／オーシャン／ティール）。デモサイトのヘッダーのスウォッチで切替 |
| `docs/sharepoint-db-design` | 本メモと DB 設計書 |

不採用として退避しているブランチ（マージ対象外）:
`design/tential-theme`（TENTIAL 版）／`design/dads-theme`（デジタル庁デザインシステム版）
