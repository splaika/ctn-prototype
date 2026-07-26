# -*- coding: utf-8 -*-
"""
CTN Suite — SharePoint バックエンド DB（リスト）設計書ジェネレータ

入力: demo/app/src/ctn/ctn-schema.json（Dataverse 構築定義の単一ソース）
      demo/app/src/ctn/types.ts（UI ドメインモデル）— 本スクリプト内に写経
出力: outputs/CTN_SharePoint_DB設計_<日付>.xlsx

設計の根拠は ctn-spfx/docs/spfx-methodology.md（方式B）と
ctn-spfx/docs/ctn-spfx-migration-brief.md §4 に従う。

再生成: python tools/gen-sharepoint-db-design.py
"""
import json
import os
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_PATH = os.path.join(ROOT, "demo", "app", "src", "ctn", "ctn-schema.json")
GEN_DATE = "2026-07-26"
DOC_VERSION = "1.1"
OUT_PATH = os.path.join(ROOT, "outputs", "CTN_SharePoint_DB設計_20260726.xlsx")

# 書体は Noto Sans JP・本文10pt で統一する（恒久設定）。
# 閲覧環境に Noto Sans JP が未インストールの場合は Excel が代替書体へフォールバックする。
FONT_NAME = "Noto Sans JP"
BODY_SIZE = 10
TITLE_SIZE = 14

schema = json.load(open(SCHEMA_PATH, encoding="utf-8"))

# 「cr_xxx」→列定義 の索引（テーブルごと）
COL_INDEX = {}
for _t in schema["tables"]:
    COL_INDEX[_t["schemaName"]] = {
        c["schemaName"].replace("cr_", "").lower(): c for c in _t["columns"]
    }

# ---------------------------------------------------------------------------
# 書式
# ---------------------------------------------------------------------------
NAVY = "1F3864"
HEAD_FILL = PatternFill("solid", fgColor=NAVY)
HEAD_FONT = Font(name=FONT_NAME, color="FFFFFF", bold=True, size=BODY_SIZE)
SUB_FILL = PatternFill("solid", fgColor="D9E2F3")
TITLE_FONT = Font(name=FONT_NAME, bold=True, size=TITLE_SIZE, color=NAVY)
NOTE_FONT = Font(name=FONT_NAME, size=BODY_SIZE, color="666666")
BODY_FONT = Font(name=FONT_NAME, size=BODY_SIZE)
# 内部名・JSONパス等も同一書体に統一する（等幅ではなくなる点は許容）
MONO_FONT = Font(name=FONT_NAME, size=BODY_SIZE)
SECT_FONT = Font(name=FONT_NAME, bold=True, size=BODY_SIZE, color=NAVY)
KEY_FONT = Font(name=FONT_NAME, bold=True, size=BODY_SIZE)
THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WARN_FILL = PatternFill("solid", fgColor="FDF0D3")
NEW_FILL = PatternFill("solid", fgColor="E2F0D9")


def sheet(wb, name, title, subtitle=None):
    ws = wb.create_sheet(name)
    ws["A1"] = title
    ws["A1"].font = TITLE_FONT
    if subtitle:
        ws["A2"] = subtitle
        ws["A2"].font = NOTE_FONT
    ws.sheet_view.showGridLines = False
    return ws


def table(ws, headers, rows, start_row, widths=None, wrap_cols=(), freeze=True):
    """ヘッダ＋明細を書き、オートフィルタ・固定行・列幅を設定する"""
    for j, h in enumerate(headers, start=1):
        c = ws.cell(row=start_row, column=j, value=h)
        c.fill = HEAD_FILL
        c.font = HEAD_FONT
        c.alignment = Alignment(vertical="center", wrap_text=True)
        c.border = BORDER
    for i, row in enumerate(rows, start=start_row + 1):
        for j, v in enumerate(row, start=1):
            c = ws.cell(row=i, column=j, value=v)
            c.font = MONO_FONT if headers[j - 1] in ("内部名", "JSONパス", "対応Dataverse列") else BODY_FONT
            c.alignment = Alignment(
                vertical="top", wrap_text=(headers[j - 1] in wrap_cols)
            )
            c.border = BORDER
    last = start_row + len(rows)
    ws.auto_filter.ref = f"A{start_row}:{get_column_letter(len(headers))}{last}"
    if freeze:
        ws.freeze_panes = ws.cell(row=start_row + 1, column=1)
    if widths:
        for j, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(j)].width = w
    ws.row_dimensions[start_row].height = 30
    return last


def kv_sheet(ws, pairs, start_row, w1=26, w2=120):
    ws.column_dimensions["A"].width = w1
    ws.column_dimensions["B"].width = w2
    r = start_row
    for k, v in pairs:
        if v is None:  # 見出し行
            c = ws.cell(row=r, column=1, value=k)
            c.font = SECT_FONT
            ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
            ws.cell(row=r, column=1).fill = SUB_FILL
            r += 1
            continue
        a = ws.cell(row=r, column=1, value=k)
        a.font = KEY_FONT
        a.alignment = Alignment(vertical="top", wrap_text=True)
        b = ws.cell(row=r, column=2, value=v)
        b.font = BODY_FONT
        b.alignment = Alignment(vertical="top", wrap_text=True)
        r += 1
    return r


def dv(table_name, prop, override=None):
    """types.ts プロパティ → Dataverse 列定義を引く（見つからなければ None）"""
    key = (override or prop).lower()
    return COL_INDEX.get(table_name, {}).get(key)


def dv_cell(table_name, prop, override=None):
    c = dv(table_name, prop, override)
    if not c:
        return ("—", "—", "—", "")
    return (
        c["schemaName"],
        c.get("requiredByType") or "—",
        c.get("xsdElement") or "—",
        c.get("status") or "",
    )


wb = Workbook()
wb.remove(wb.active)
# 既定スタイル（Normal）も同一書体にし、明示指定の無いセルもフォールバックしないようにする
wb._named_styles["Normal"].font = Font(name=FONT_NAME, size=BODY_SIZE)

# ===========================================================================
# 00_設計方針
# ===========================================================================
ws = sheet(wb, "00_設計方針", "CTN Suite — SharePoint バックエンド DB（リスト）設計")
pairs = [
    ("文書情報", None),
    ("文書名", "CTN Suite SharePoint バックエンド DB（リスト）設計書"),
    ("版 / 更新日", f"{DOC_VERSION} / {GEN_DATE}"),
    ("改訂履歴", "1.0 (2026-07-25) 初版。"
                "1.1 (2026-07-26) 提出パッケージ出力（届書PDF＋CTN XML）の main マージを受けて "
                "§5「PDF/XML 出力の位置づけ」を追加し、CtnPdfGeneratedAt 列・CtnGeneratedOutputs "
                "ライブラリ・ロジック2件・画面連携1件を追記。既存の列定義・Payload構造は変更なし。"),
    ("対象システム", "治験届（CTN: Clinical Trial Notification）管理システム"),
    ("生成元", "demo/app/src/ctn/ctn-schema.json（14テーブル/207列）＋ types.ts（UIドメインモデル）"),
    ("根拠文書", "ctn-spfx/docs/spfx-methodology.md（方式B 設計判断）／ctn-spfx/docs/ctn-spfx-migration-brief.md §4（データ設計）／CLAUDE.md（採番ツリー原則）"),
    ("再生成コマンド", "python tools/gen-sharepoint-db-design.py"),

    ("1. 前提アーキテクチャ", None),
    ("実行基盤", "SharePoint ページ / Teams タブ上の SPFx Web パーツ「CtnSuite」。M365 ライセンスのみで稼働（Power Apps Premium 不要）"),
    ("認証", "SharePoint のユーザーコンテキスト（pageContext）。アプリ側の実装ゼロ。操作ユーザー（actor）は loginName を正とし自己申告にしない"),
    ("データアクセス", "React コンポーネント → CtnRepository（抽象） → SharePointCtnRepository（spHttpClient / SP REST）。コンポーネントからの直接 REST 呼び出しは禁止"),
    ("ドメインロジック", "logic.ts / derive.ts / xml.ts / rules.ts の純粋関数を変更せず流用。保存・承認・提出でリポジトリ層が必ず再実行する"),

    ("2. 中核となる設計判断", None),
    ("(1) 届は「集約JSON＋昇格列」で1リストに保存する",
     "Dataverse 構想の14テーブル正規化を SharePoint に持ち込まない。理由は3点。"
     "① ドメインモデル Notification が既に集約であり、updateNotification(n) は集約全体の置換を契約とする。"
     "② SharePoint にはリスト横断トランザクションが無い。子を6リストに割ると1回の保存が非原子的になり、採番・XML生成の前提が壊れる。集約JSONなら常に「1アイテム1書き込み＝原子的」。"
     "③ リストのバージョン管理がそのまま「届のスナップショット履歴」として機能する。"),
    ("(2) 昇格列は投影であって正本ではない",
     "CtnPayload（集約JSON）が正本。昇格列は一覧表示・フィルタ・ダッシュボード集計のための投影。"
     "保存時に Payload と昇格列を必ず同一の書き込みで更新する（別々に更新しない）。"),
    ("(3) 日付は SharePoint 日付型を使わず YYYY-MM-DD 文字列で保持",
     "タイムゾーン変換による日付ずれを回避するため。届出年月日・提出期限・変更年月日など、法令上の「日」がずれると"
     "30日調査・提出期限の判断を誤る。ソート・フィルタは ISO 文字列の辞書順で正しく機能する。"),
    ("(4) 列内部名は Ctn プレフィックス必須",
     "Title / Status / Order / Owner / Created 等の SharePoint 予約名との衝突を避ける。参照列の書き込みは {内部名}Id を使う。"),
    ("(5) 物理削除しない（論理削除）",
     "マスタは CtnActive（はい/いいえ）で無効化し履歴を保持。医師の同一性キー（CtnDoctors のアイテムID）は改名しても不変。"
     "届は下書きのみ削除可、提出済は削除不可。"),
    ("(6) 選択肢の格納方式",
     "数値 enum（Dataverse の 100000xxx 系コード値）は数値列に保持し、ラベルは ctn-schema.json から引く（ハードコード禁止）。"
     "文字列 union（notifType / status / role）は SharePoint 選択肢列にして標準UIでも絞り込めるようにする。"),
    ("(7) ドメインID とアイテムID",
     "SharePoint のアイテム ID（数値）を String() 化してドメインの文字列 id とする。変換はリポジトリ境界で完結させ UI へ漏らさない。"),

    ("3. 二層検証（サーバー正本）の扱い — 最大のトレードオフ", None),
    ("問題", "本来の設計思想は「クライアント＝提案のみ、確定＝サーバー」。Dataverse 構想では serverLogic 16件をプラグインが強制する。"
             "SPFx はブラウザ内でのみ実行されるため、この意味での「サーバー」が存在しない。"),
    ("受け入れる前提", "採番・職務分離・提出ゲートの強制はリポジトリ層（ブラウザ内）で行う。これは意図的なトレードオフとして受け入れる。"),
    ("緩和策1: 書き込み経路の一本化", "全書き込みを SharePointCtnRepository に集約し、保存・承認・提出で logic.ts の検証を必ず再実行する"),
    ("緩和策2: 楽観的同時実行制御", "更新は取得時 etag の IF-MATCH（'*' 禁止）。412 Precondition Failed は再取得して競合をユーザーに提示。"
                                    "特に提出時の順序番号確定は「同一シリーズの最新届を再取得 → 再計算 → etag付き書き込み → 412ならリトライ」ループで衝突を排除する"),
    ("緩和策3: リスト直編集の統制", "サイトナビゲーションからリストを隠す／編集権限を利用メンバーに限定／バージョン管理で事後検知。"
                                  "厳密な強制が必要になった時点が Dataverse 移行の判断トリガー"),
    ("残余リスク", "サイト権限を持つ利用者は SharePoint 標準UIからリストを直接編集でき、アプリの検証を迂回しうる（運用で緩和）"),

    ("4. PDF / XML 出力の位置づけ（2026-07-26 追記）", None),
    ("現行実装", "ブランチ claude/ctn-output-pdf-xml を main へマージ済み。届出詳細の［提出パッケージ出力］で "
                "① CTN XML（xml.ts）② 届書PDF（output.ts: html2canvas でラスタライズ → pdf-lib でページ化）を生成し、"
                "添付「検査キット/パッキングリスト」があれば実PDFを結合して1ファイル化する。"),
    ("★用途の切り分け（重要）",
     "現行の届書PDFは【社内レビュー用】。PMDA への提出正本は XML（＋添付PDF）である。"
     "ただし PMDA 提出用PDFは最終的に必須となる見込みであり、その段階では要件が変わる（下記）。"),
    ("現行方式の制約",
     "① ラスタライズ方式のため PDF 内のテキストが選択・検索・コピーできない。"
     "② ページ分割が画像のオフセットずらしのため、表や行がページ境界で切断されうる。"
     "③ html2canvas + pdf-lib によりバンドルが増加（demo/index.html が約450KB → 約1,081KB）。"
     "社内レビュー用途では許容できるが、提出用途では①が問題になる。"),
    ("★設計上の整合性リスク",
     "ctn-schema.json の添付資料テーブルには cr_hastext（テキスト含有チェック）と cr_hasbookmarks（しおり付与チェック）"
     "があり、これは PMDA の PDF 品質要件に対応する。ラスタライズPDFはテキストを含まないため、"
     "提出用途へ格上げする際は必ず方式の見直しが必要になる。"),
    ("提出用途へ格上げする場合の方式",
     "Word テンプレート＋SharePoint/OneDrive の「ファイルの変換」アクション（標準コネクタのため追加費用なし）による"
     "サーバー側生成を推奨。様式の再現度が高く、テキスト選択可・日本語フォント問題なしを同時に満たす。"
     "pdf-lib への日本語フォント埋め込みは Noto Sans JP でバンドルが数MB増えるため SPFx では割に合わない。"),
    ("本設計への影響（いずれも追記のみ・既存定義は不変）",
     "① CtnNotifications に CtnPdfGeneratedAt を1列追加（CtnXmlGeneratedAt と対称）。"
     "② 生成物の保管先として CtnGeneratedOutputs ドキュメントライブラリを追加。"
     "③ 06_ロジック実装マップ に「届書PDF生成」「提出パッケージ結合」の2件を追加。"
     "④ 07_画面データ連携 に「提出パッケージ出力」を追加。"
     "データモデル本体（CtnPayload の構造）は変更不要。PDF は Payload からの出力にすぎないため。"),
    ("CtnAttachmentFiles の段階",
     "現行は添付のメタデータのみを Payload に保持し、実ファイルは持たない（デモはサンプルPDFを生成して結合）。"
     "★実ファイル結合を本番で行う段階（＝提出用途への格上げ時）に CtnAttachmentFiles が必須となる。"
     "社内レビュー用途に留まる限りは将来フェーズのままでよい。"),

    ("5. 本設計で新規に追加したリスト（demo/app には対応する永続化が無い）", None),
    ("CtnSettings", "rules.ts の RuleSettings（提出期限オフセット・アラート閾値・有効/無効）は現状メモリ内シングルトンでリロード時に既定へ戻る。"
                    "バックエンド化にあたり単一アイテムのリストとして永続化する。全利用者で共有される設定のため、更新は薬事担当ロールに限定する。"),
    ("CtnAppUsers", "職務分離（起票者≠承認者）の判定にはロール（起票/レビュー/承認/薬事）が必要。"
                    "actor 自体は pageContext から取るが、ロールの正本が無いと承認可否を判定できないため loginName → ロールの登録簿を持つ。"
                    "SharePoint グループでの代替も可能だが、UI がロールラベルを表示する都合上リスト方式を推奨。"),
    ("CtnAttachmentFiles", "現アプリの添付はメタデータのみ（実ファイルは持たない）。実ファイル格納はドキュメントライブラリとして将来フェーズで追加する。"
                           "本設計では列定義のみ記載し、Phase 1 のスコープ外とする。"),
]
kv_sheet(ws, pairs, 4, w1=34, w2=125)

# ===========================================================================
# 01_リスト一覧
# ===========================================================================
ws = sheet(wb, "01_リスト一覧", "リスト一覧",
           "★=本設計で新規追加。件数は約31名・数年運用を想定した概算。")
lists = [
    ("1", "CtnNotifications", "治験届", "トランザクション（中核）",
     "1件の届出（計画/変更/中止/終了/開発中止）。子要素（治験使用薬・実施医療機関・医師ロスター・数量・添付・参照・照会）を集約JSONで内包",
     "正本（CtnPayload）＋投影（昇格列）", "数百〜2,000", "有（主要・スナップショット履歴）",
     "作成/更新/削除(下書きのみ)/レビュー依頼/承認/提出/XML生成", "Notification", ""),
    ("2", "CtnCompounds", "治験成分（シリーズ）", "トランザクション（親）",
     "治験成分記号ごとのシリーズ。届出回数の通算・30日調査の起算基盤", "正本", "数十〜数百", "有",
     "作成/更新（開発状態は開発中止届の提出で自動更新）", "Compound", "compoundCode は一意"),
    ("3", "CtnSponsors", "治験届出者", "マスタ", "届出者・業者コード・届出担当者", "正本", "1〜10", "有",
     "作成/更新/論理削除", "Sponsor", ""),
    ("4", "CtnInstitutions", "医療機関マスタ", "マスタ", "機関名・所在地・代表電話", "正本", "数十〜数百", "有",
     "作成/更新/論理削除", "Institution", ""),
    ("5", "CtnDoctors", "医師マスタ", "マスタ",
     "不変の医師ID。原表記／届出用表記（外字正規化済み）の二段構え。改名は同一アイテム更新＋イベント行で表現",
     "正本", "数百〜数千", "有", "作成/更新/論理削除", "Doctor", "アイテムIDが不変の同一性キー"),
    ("6", "CtnSiteStaff", "治験実施現場担当", "マスタ", "CRC・SMO事務局・薬剤部の連絡先（XML対象外・運用情報）",
     "正本", "数百", "有", "作成/更新/論理削除", "SiteStaff", ""),
    ("7", "CtnIrbs", "IRBマスタ", "マスタ", "IRB設置者・所在地・院内/外部区分", "正本", "数十", "有",
     "作成/更新/論理削除", "Irb", ""),
    ("8", "CtnGaiji", "外字置換履歴", "履歴", "外字の検出・置換・確認履歴（医師単位）。置換説明資料の根拠",
     "正本", "数百", "有", "追記のみ", "GaijiRecord", ""),
    ("9", "CtnAudit", "監査ログ", "履歴（追記専用）",
     "全書き込み操作の記録。更新・削除メソッドを実装しない", "正本", "数千〜数万", "有（改ざん検知）",
     "追記のみ", "AuditEntry", "5,000件しきい値の主要対策対象"),
    ("10★", "CtnSettings", "ロジカルチェック設定", "設定（単一アイテム）",
     "提出期限オフセット・アラート閾値・各リマインダの有効/無効", "正本", "1", "有",
     "更新のみ（薬事担当ロール限定）", "RuleSettings（rules.ts）", "現状メモリ内 → 永続化"),
    ("11★", "CtnAppUsers", "アプリ利用者・ロール", "マスタ",
     "loginName → ロール（起票/レビュー/承認/薬事）の登録簿。職務分離の判定に使用", "正本", "約31", "有",
     "作成/更新/論理削除（管理者限定）", "User（refData.ts の USERS）", "actor 自体は pageContext から取得"),
    ("12★", "CtnAttachmentFiles", "添付ファイル", "ドキュメントライブラリ",
     "Protocol / IB / ICF / 検査キット・パッキングリスト 等の実ファイル格納", "正本（ファイル実体）", "数百", "有",
     "アップロード/差替え", "Attachment（メタデータは Payload 側）",
     "将来フェーズ。★提出パッケージで実ファイルを結合する段階（提出用途への格上げ時）に必須化する"),
    ("13★", "CtnGeneratedOutputs", "生成物", "ドキュメントライブラリ",
     "提出パッケージ出力の生成物（届書PDF・CTN XML）の保管", "生成物（正本は CtnPayload）", "数百〜2,000", "有",
     "生成時に自動アップロード（上書きせず版を積む）", "—（新規）",
     "既存の SharePoint 文書設計（Source PDFs / Attachments / Generated Outputs の3ライブラリ構成）へ寄せる"),
]
last = table(ws, ["No", "リスト内部名", "表示名", "種別", "役割", "正本/投影", "想定件数",
                  "バージョン管理", "主な操作", "対応 types.ts", "備考"],
             lists, 4,
             widths=[6, 22, 20, 22, 52, 22, 12, 26, 40, 26, 30],
             wrap_cols=("役割", "主な操作", "備考", "正本/投影", "バージョン管理"))
for r in range(5, last + 1):
    if str(ws.cell(row=r, column=1).value).endswith("★"):
        for c in range(1, 12):
            ws.cell(row=r, column=c).fill = NEW_FILL

# ===========================================================================
# 02_列定義
# ===========================================================================
ws = sheet(wb, "02_列定義", "リスト列定義",
           "SP型: 単一行=単一行テキスト / 複数行=複数行テキスト(プレーン) / 数値=数値 / 選択肢=選択肢 / はい/いいえ=Yes-No / 参照=Lookup。"
           "内部名は Ctn プレフィックス必須（予約名衝突の回避）。参照列の書き込みは {内部名}Id。")

# (リスト, 内部名, 表示名, SP型, 必須, 一意, インデックス, 既定値, 選択肢/範囲, types.ts, 用途・備考)
cols = []


def add(lst, name, disp, sptype, req="", uniq="", idx="", default="", choices="", ts="", note=""):
    cols.append((lst, name, disp, sptype, req, uniq, idx, default, choices, ts, note))


# ---- CtnNotifications（昇格列のみ。実データは CtnPayload） ----
L = "CtnNotifications"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "",
    "id", "SharePoint 標準列。String() 化してドメイン id とする")
add(L, "Title", "表示名", "単一行", "○", "", "", "", "",
    "（組立値）", "例「AMG410 届2/変1 治験計画変更届」。保存時にリポジトリが組み立てる")
add(L, "CtnCompound", "治験成分", "参照（CtnCompounds）", "○", "", "○", "", "",
    "compoundId", "シリーズ絞り込み。書き込みは CtnCompoundId")
add(L, "CtnCompoundCode", "治験成分記号", "単一行", "○", "", "○", "", "",
    "（非正規化）", "参照をたどらずに一覧の検索・フィルタを行うための非正規化列。保存時に親から転記")
add(L, "CtnNotifType", "届出種別", "選択肢", "○", "", "○", "", "plan / change / termination / completion / devDiscontinuation",
    "notifType", "types.ts の NotifTypeKey をそのまま選択肢値に（数値コードは Payload 内）")
add(L, "CtnFilingCount", "届出回数", "数値（整数）", "○", "", "○", "", "1以上",
    "filingCount", "★採番の中核。新規プロトコールの計画届でのみ +1。変更/終了/中止は対象プロトコールを継承（据え置き）")
add(L, "CtnChangeCount", "変更回数", "数値（整数）", "", "", "", "", "0以上",
    "changeCount", "★変更届のみ採番。届出回数（プロトコール）内の枝番。計画届等は空")
add(L, "CtnStatus", "ステータス", "選択肢", "○", "", "○", "draft", "draft / review / approved / submitted",
    "status", "手動変更不可。ワークフローメソッド経由でのみ遷移")
add(L, "CtnKubun", "届出区分", "数値", "", "", "", "", "100000200 / 100000201 / 100000202",
    "kubun", "保存時に recommendKubun() で再計算して確定")
add(L, "CtnProtocolNo", "実施計画書識別記号", "単一行", "", "", "", "", "",
    "protocolNo", "")
add(L, "CtnNoteDate", "届出年月日", "単一行", "", "", "○", "", "YYYY-MM-DD",
    "noteDate", "提出ステップで自動設定（提出日）。日付型を使わない（TZずれ回避）")
add(L, "CtnDeadline", "提出期限", "単一行", "", "", "○", "", "YYYY-MM-DD",
    "（派生）", "computeDeadline() の結果を保存時に再計算して昇格。一覧ソート・アラート抽出用。正は都度再計算")
add(L, "CtnPlannedStartDate", "治験開始予定日", "単一行", "", "", "", "", "YYYY-MM-DD",
    "plannedStartDate", "提出期限の算定起点")
add(L, "CtnIs30DayReview", "30日調査対象", "はい/いいえ", "", "", "○", "いいえ", "",
    "（派生）", "is30DayReview() の結果を昇格。計画届∧届出回数=1 → 真")
add(L, "CtnCreatedByUser", "起票者", "単一行", "○", "", "○", "", "loginName",
    "createdBy", "★職務分離の判定に使用。pageContext の loginName を保存（自己申告にしない）")
add(L, "CtnApprovedByUser", "承認者", "単一行", "", "", "", "", "loginName",
    "approvedBy", "★起票者と異なることを承認時に強制")
add(L, "CtnReviewedByUser", "レビュー者", "単一行", "", "", "", "", "loginName",
    "reviewedBy", "")
add(L, "CtnApprovedAt", "承認日時", "単一行", "", "", "", "", "ISO8601",
    "approvedAt", "")
add(L, "CtnSubmittedAt", "提出日時", "単一行", "", "", "", "", "ISO8601",
    "submittedAt", "")
add(L, "CtnXmlGeneratedAt", "XML生成日時", "単一行", "", "", "", "", "ISO8601",
    "xmlGeneratedAt", "")
add(L, "CtnPdfGeneratedAt", "届書PDF生成日時", "単一行", "", "", "", "", "ISO8601",
    "（新規）", "提出パッケージ出力の実行日時。CtnXmlGeneratedAt と対称に持つ。"
    "現行の届書PDFは社内レビュー用（ラスタライズ方式）")
add(L, "CtnPayload", "集約ペイロード", "複数行（プレーン）", "○", "", "×", "", "JSON",
    "Notification 全体", "★正本。子配列（studyDrugs / sites / attachments / references / inquiries）を内包。"
    "リッチテキストにしない（HTMLエスケープでJSONが壊れる）")
add(L, "CtnPayloadVersion", "ペイロード版", "単一行", "○", "", "", "1", "",
    "（メタ）", "将来のスキーマ移行用。リポジトリ内でマイグレーション分岐")
add(L, "Modified / Editor", "更新日時 / 更新者", "標準列", "自動", "", "", "", "",
    "—", "SharePoint 標準。楽観ロックの etag と併用")

# ---- CtnCompounds ----
L = "CtnCompounds"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "ドメイン id")
add(L, "Title", "治験成分記号", "単一行", "○", "○", "○", "", "半角英数字＋ハイフン・20桁以内・「&」不可",
    "compoundCode", "★validateCompoundCode() で検証。スペース有無で別記号と判定される")
add(L, "CtnTargetCategory", "対象区分", "数値", "○", "", "", "100000100", "医薬品/医療機器/再生医療等製品",
    "targetCategory", "")
add(L, "CtnTrialKind", "治験の種類", "単一行", "○", "", "", "", "", "trialKind", "")
add(L, "CtnInitReceptNo", "初回届出受付番号", "単一行", "", "", "", "", "", "initReceptNo", "")
add(L, "CtnInitNoteDate", "初回届出年月日", "単一行", "", "", "", "", "YYYY-MM-DD", "initNoteDate",
    "30日調査の起算日")
add(L, "CtnDevStatus", "開発状態", "数値", "○", "", "○", "100000900", "開発中 / 開発中止",
    "devStatus", "★開発中止届の提出で自動的に「開発中止」へ遷移")
add(L, "CtnSponsor", "主たる届出者", "参照（CtnSponsors）", "○", "", "", "", "", "sponsorId",
    "Dataverse 構想の cr_compound には無い列。UI が保持するため追加")
add(L, "CtnDrugName", "代表的な被験薬名称", "単一行", "", "", "", "", "", "drugName", "表示用")
add(L, "CtnCreatedAt", "作成日時", "単一行", "", "", "", "", "ISO8601", "createdAt", "")

# ---- CtnSponsors ----
L = "CtnSponsors"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "届出者の名称", "単一行", "○", "", "○", "", "", "name", "")
add(L, "CtnSponsorType", "届出者の種別", "単一行", "○", "", "", "", "", "sponsorType", "")
add(L, "CtnRepName", "代表者の氏名", "単一行", "○", "", "", "", "", "repName", "変更時は変更届（変更後6ヶ月以内）の対象")
add(L, "CtnAddress1", "所在地1", "単一行", "○", "", "", "", "", "address1", "")
add(L, "CtnAddress2", "所在地2", "単一行", "", "", "", "", "", "address2", "")
add(L, "CtnManufacturerCode", "業者コード", "単一行", "○", "", "", "", "コード表", "manufacturerCode", "")
add(L, "CtnContactName", "届出担当者の氏名", "単一行", "○", "", "", "", "", "contactName", "")
add(L, "CtnContactTitle", "届出担当者の所属", "単一行", "○", "", "", "", "", "contactTitle", "")
add(L, "CtnTelNo", "電話番号", "単一行", "○", "", "", "", "", "telNo", "")
add(L, "CtnFaxOrMail", "FAX番号又はメールアドレス", "単一行", "○", "", "", "", "", "faxOrMail", "")
add(L, "CtnOverseasInfo", "海外依頼者・外国製造業者情報", "複数行", "", "", "", "", "", "overseasInfo",
    "⚠要確認（邦文4項目＋外国文4項目の構造を手引き・XSDと突合して確定させる）")
add(L, "CtnActive", "有効", "はい/いいえ", "○", "", "○", "はい", "", "active", "論理削除（物理削除しない）")

# ---- CtnInstitutions ----
L = "CtnInstitutions"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "機関名称", "単一行", "○", "", "○", "", "", "name", "")
add(L, "CtnCode", "機関コード", "単一行", "○", "○", "○", "", "", "code", "表示用の一意コード")
add(L, "CtnAddress1", "所在地1", "単一行", "○", "", "", "", "", "address1", "")
add(L, "CtnAddress2", "所在地2", "単一行", "", "", "", "", "", "address2", "")
add(L, "CtnTelNo", "代表電話番号", "単一行", "○", "", "", "", "", "telNo", "")
add(L, "CtnActive", "有効", "はい/いいえ", "○", "", "○", "はい", "", "active", "論理削除で履歴保持")

# ---- CtnDoctors ----
L = "CtnDoctors"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id",
    "★不変の同一性キー。改名しても不変（アイテムを作り直さない）")
add(L, "Title", "氏名（原表記）", "単一行", "○", "", "○", "", "", "nameOriginal", "外字を含みうる元の表記")
add(L, "CtnDoctorNo", "医師表示ID", "単一行", "○", "○", "○", "", "", "doctorNo",
    "自動採番（Dataverse のオートナンバー相当をリポジトリ層で実装）")
add(L, "CtnNameFiling", "氏名（届出用表記）", "単一行", "○", "", "", "", "", "nameFiling",
    "★外字正規化済み。XML に出力されるのはこちら")
add(L, "CtnPronounce", "よみかな", "単一行", "○", "", "", "", "全角50字（100バイト）以内", "pronounce",
    "★checkByteLimit() の対象")
add(L, "CtnMedSchoolNo", "大学番号", "単一行", "○", "", "", "", "コード表", "medSchoolNo", "責任医師想定")
add(L, "CtnGraduationYear", "卒業年", "単一行", "○", "", "", "", "", "graduationYear", "")
add(L, "CtnHasGaiji", "外字有無", "はい/いいえ", "○", "", "○", "いいえ", "", "hasGaiji",
    "detectGaiji() の検出結果。真なら届出前に確認ダイアログを必須にする")
add(L, "CtnInstitution", "主たる所属医療機関", "参照（CtnInstitutions）", "", "", "", "", "", "institutionId",
    "運用・表示用（XML対象外）")
add(L, "CtnActive", "有効", "はい/いいえ", "○", "", "○", "はい", "", "active", "")

# ---- CtnSiteStaff ----
L = "CtnSiteStaff"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "氏名", "単一行", "○", "", "", "", "", "name", "")
add(L, "CtnKana", "よみかな", "単一行", "", "", "", "", "", "kana", "")
add(L, "CtnRole", "役割", "選択肢", "○", "", "", "CRC", "CRC / 事務局 / 薬剤部", "role", "")
add(L, "CtnInstitution", "所属医療機関", "参照（CtnInstitutions）", "○", "", "○", "", "", "institutionId", "")
add(L, "CtnTelNo", "電話番号", "単一行", "", "", "", "", "", "telNo", "")
add(L, "CtnMail", "メールアドレス", "単一行", "", "", "", "", "", "mail", "")
add(L, "CtnActive", "有効", "はい/いいえ", "○", "", "○", "はい", "", "active", "XML対象外・運用連絡先")

# ---- CtnIrbs ----
L = "CtnIrbs"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "設置者の名称", "単一行", "○", "", "○", "", "", "ownerName", "")
add(L, "CtnIrbType", "院内・外部の区分", "数値", "○", "", "", "100001400", "院内 / 外部", "irbType", "")
add(L, "CtnAddress1", "所在地1", "単一行", "○", "", "", "", "", "address1", "")
add(L, "CtnAddress2", "所在地2", "", "", "", "", "", "", "address2", "")
add(L, "CtnActive", "有効", "はい/いいえ", "○", "", "○", "はい", "", "active", "")

# ---- CtnGaiji ----
L = "CtnGaiji"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "表示名", "単一行", "○", "", "", "", "", "（組立値）", "例「D-0003 髙→高」")
add(L, "CtnDoctor", "医師", "参照（CtnDoctors）", "○", "", "○", "", "", "doctorId", "医師ごとの確認履歴")
add(L, "CtnNotification", "検出発生届", "参照（CtnNotifications）", "", "", "", "", "", "notificationId", "")
add(L, "CtnTargetColumn", "対象列", "単一行", "○", "", "", "", "", "targetColumn", "例「CtnDoctors.CtnNameOriginal」")
add(L, "CtnOriginalChar", "元字", "単一行", "○", "", "", "", "1文字", "originalChar", "")
add(L, "CtnCodePoint", "コードポイント", "単一行", "○", "", "", "", "U+XXXX", "codePoint", "")
add(L, "CtnReplacementChar", "代替字", "単一行", "○", "", "", "", "1文字", "replacementChar", "⚠要確認（縮退マップは本番で標準＋社内辞書に差し替え）")
add(L, "CtnGaijiType", "判定区分", "数値", "○", "", "", "", "JIS外/機種依存/IVS/私用領域", "gaijiType", "")
add(L, "CtnConfirmedBy", "確認者", "単一行", "○", "", "", "", "loginName", "confirmedBy", "人間の確認を必須にする（自動置換のみで完結させない）")
add(L, "CtnConfirmedOn", "確認日時", "単一行", "○", "", "", "", "ISO8601", "confirmedOn", "")

# ---- CtnAudit ----
L = "CtnAudit"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "表示名", "単一行", "○", "", "", "", "", "（組立値）", "")
add(L, "CtnAt", "発生日時", "単一行", "○", "", "○", "", "ISO8601", "at", "★インデックス必須（既定ビューの並べ替え＋期間フィルタ）")
add(L, "CtnWho", "操作者", "単一行", "○", "", "○", "", "loginName", "who", "pageContext から取得")
add(L, "CtnAction", "操作", "選択肢", "○", "", "○", "", "create / update / delete / restore / submit / approve / generate-xml", "action", "")
add(L, "CtnEntity", "対象", "単一行", "○", "", "", "", "", "entity", "リスト表示名")
add(L, "CtnEntityRef", "対象識別子", "単一行", "○", "", "○", "", "", "entityRef", "")
add(L, "CtnSummary", "内容", "複数行", "○", "", "", "", "", "summary", "何を・どう変えたか")

# ---- CtnSettings ----
L = "CtnSettings★"
add(L, "Title", "設定名", "単一行", "○", "○", "", "default", "", "（固定）", "単一アイテム運用。アイテムを増やさない")
add(L, "CtnOffset30", "30日調査の期限オフセット", "数値（整数）", "○", "", "", "30", "日数", "offset30",
    "治験開始予定日 − N日。★変更は提出期限の全再計算に波及する")
add(L, "CtnOffset14", "通常の期限オフセット", "数値（整数）", "○", "", "", "14", "日数", "offset14", "")
add(L, "CtnWarnDays", "期限接近アラート（黄）閾値", "数値（整数）", "○", "", "", "14", "日数", "warnDays", "")
add(L, "CtnHotDays", "期限接近アラート（赤）閾値", "数値（整数）", "○", "", "", "7", "日数", "hotDays", "")
add(L, "CtnInquiryDays", "PMDA照会リマインダ閾値", "数値（整数）", "○", "", "", "21", "日数", "inquiryDays", "")
add(L, "CtnBatchMonths", "定期報告バッチ", "数値（整数）", "○", "", "", "12", "か月", "batchMonths", "分担医師の異動のみが対象")
add(L, "CtnOverdue", "期限超過アラート", "はい/いいえ", "○", "", "", "はい", "", "overdue", "")
add(L, "CtnSubmitReminder", "提出待ちリマインダ", "はい/いいえ", "○", "", "", "はい", "", "submitReminder", "")
add(L, "CtnInquiryReminder", "PMDA照会リマインダ", "はい/いいえ", "○", "", "", "はい", "", "inquiryReminder", "")
add(L, "CtnBatchReminder", "定期報告 保留リマインダ", "はい/いいえ", "○", "", "", "はい", "", "batchReminder", "")

# ---- CtnAppUsers ----
L = "CtnAppUsers★"
add(L, "ID", "アイテムID", "数値（標準）", "自動", "○", "自動", "", "", "id", "")
add(L, "Title", "表示名", "単一行", "○", "", "", "", "", "name", "")
add(L, "CtnLoginName", "ログイン名", "単一行", "○", "○", "○", "", "UPN", "（新規）",
    "★pageContext.user.loginName と突合するキー")
add(L, "CtnInitials", "イニシャル", "単一行", "", "", "", "", "", "initials", "アバター表示用")
add(L, "CtnRole", "ロール", "選択肢", "○", "", "○", "drafter", "drafter / reviewer / approver / regulatory", "role",
    "★承認可否・設定変更可否の判定に使用")
add(L, "CtnDept", "所属", "単一行", "", "", "", "", "", "dept", "")
add(L, "CtnActive", "有効", "はい/いいえ", "○", "", "○", "はい", "", "active", "")

# ---- CtnAttachmentFiles ----
L = "CtnAttachmentFiles★"
add(L, "FileLeafRef", "ファイル名", "標準（ファイル）", "○", "", "", "", "255バイト以内", "docName",
    "★checkByteLimit() の対象。将来フェーズ")
add(L, "CtnNotification", "届出", "参照（CtnNotifications）", "○", "", "○", "", "", "（Payload側 id）", "")
add(L, "CtnDocType", "資料種別", "数値", "○", "", "○", "", "Protocol / IB / ICF ほか", "docType", "")
add(L, "CtnHasBookmarks", "しおり付与", "はい/いいえ", "", "", "", "いいえ", "", "hasBookmarks", "PMDA提出要件のチェック")
add(L, "CtnHasText", "テキスト含有", "はい/いいえ", "", "", "", "いいえ", "", "hasText", "スキャンPDF検出用")
add(L, "CtnAttachStatus", "添付ステータス", "数値", "○", "", "", "", "添付済 / 確認中 / 任意", "attachStatus", "")

# ---- CtnGeneratedOutputs ----
L = "CtnGeneratedOutputs★"
add(L, "FileLeafRef", "ファイル名", "標準（ファイル）", "○", "", "", "", "255バイト以内", "（組立値）",
    "例「AMG410_届2変1_治験計画変更届_20260726.pdf」。★checkByteLimit() の対象")
add(L, "CtnNotification", "届出", "参照（CtnNotifications）", "○", "", "○", "", "", "（Notification id）", "")
add(L, "CtnOutputKind", "生成物種別", "選択肢", "○", "", "○", "", "pdf-review / pdf-submission / xml", "（新規）",
    "★pdf-review=社内レビュー用（現行・ラスタライズ）／pdf-submission=提出用（将来・テキスト選択可）")
add(L, "CtnGeneratedAt", "生成日時", "単一行", "○", "", "○", "", "ISO8601", "（新規）", "")
add(L, "CtnGeneratedBy", "生成者", "単一行", "○", "", "", "", "loginName", "（新規）", "")
add(L, "CtnPageCount", "ページ数", "数値（整数）", "", "", "", "", "", "（新規）", "PDFのみ。output.ts の pageCount")
add(L, "CtnPackingLists", "結合した添付数", "数値（整数）", "", "", "", "", "", "（新規）",
    "検査キット/パッキングリストの結合件数。output.ts の packingListsIncluded")
add(L, "CtnPayloadVersionAtGen", "生成時ペイロード版", "単一行", "", "", "", "", "", "（新規）",
    "どの版の Payload から生成したかの追跡。再生成時の同一性確認に使う")

last = table(ws, ["リスト", "内部名", "表示名", "SP型", "必須", "一意", "インデックス", "既定値",
                  "選択肢/範囲", "対応 types.ts", "用途・備考"],
             cols, 5,
             widths=[22, 24, 26, 22, 7, 7, 12, 12, 40, 22, 62],
             wrap_cols=("用途・備考", "選択肢/範囲", "表示名"))
for r in range(6, last + 1):
    note = ws.cell(row=r, column=11).value or ""
    if "⚠" in note:
        for c in range(1, 12):
            ws.cell(row=r, column=c).fill = WARN_FILL
    elif str(ws.cell(row=r, column=1).value).endswith("★"):
        for c in range(1, 12):
            ws.cell(row=r, column=c).fill = NEW_FILL

# ===========================================================================
# 03_Payload構造
# ===========================================================================
ws = sheet(wb, "03_Payload構造", "CtnPayload（集約JSON）の構造",
           "CtnNotifications.CtnPayload に格納される Notification 集約の全項目。"
           "「必須(計/変/中/終/開)」と「XSD要素」は ctn-schema.json から自動突合。◎=常時必須 ○=種別により必須 △=任意 ―=非該当")

# (JSONパス, プロパティ, TS型, dvテーブル, 上書きキー, 備考)
pay = [
    ("$", "（ルート）", "Notification", None, None, "1件の届出。updateNotification(n) は集約全体を置換する"),
    ("$.id", "id", "string", None, None, "SharePoint アイテムID を String() 化した値"),
    ("$.compoundId", "compoundId", "string", "cr_notification", "compoundid", "昇格列 CtnCompound と二重保持"),
    ("$.notifType", "notifType", "NotifTypeKey", "cr_notification", "notiftype", "昇格列 CtnNotifType と二重保持"),
    ("$.filingCount", "filingCount", "number", "cr_notification", "filingcount", "★新規プロトコールの計画届でのみ +1"),
    ("$.changeCount", "changeCount", "number?", "cr_notification", "changecount", "★変更届のみ採番"),
    ("$.receptNo", "receptNo", "string?", "cr_notification", "receptno", "計画届では空欄を強制"),
    ("$.receptDate", "receptDate", "string?", "cr_notification", "receptdate", "参照する計画届の年月日"),
    ("$.noteDate", "noteDate", "string?", "cr_notification", "notedate", ""),
    ("$.kubun", "kubun", "number?", "cr_notification", "kubun", "推奨→人間が確定→保存時に再計算"),
    ("$.subj30dayReview", "subj30dayReview", "number?", "cr_notification", "subj30dayreview", ""),
    ("$.plannedStartDate", "plannedStartDate", "string?", "cr_notification", "plannedstartdate", "提出期限の算定起点"),
    ("$.status", "status", "StatusKey", "cr_notification", "status", "昇格列 CtnStatus と二重保持"),
    ("$.changeLocations", "changeLocations", "number[]", "cr_notification", "changelocations", "★複数選択。提出時期4区分の判定入力"),
    ("$.changeDate", "changeDate", "string?", "cr_notification", "changedate", "★変更届の提出時期の起点"),
    ("$.changeReason", "changeReason", "string?", "cr_notification", "changereason", ""),
    ("$.terminationDate", "terminationDate", "string?", "cr_notification", "terminationdate", ""),
    ("$.terminationReason", "terminationReason", "string?", "cr_notification", "terminationreason", ""),
    ("$.postTermination", "postTermination", "string?", "cr_notification", "posttermination", ""),
    ("$.protocolNo", "protocolNo", "string", "cr_notification", "protocolno", ""),
    ("$.phase", "phase", "number?", "cr_notification", "phase", ""),
    ("$.trialType", "trialType", "number?", "cr_notification", "trialtype", ""),
    ("$.objectives", "objectives", "string", "cr_notification", "objectives", "変更は「変更前」提出時期"),
    ("$.plannedSubjDrug", "plannedSubjDrug", "number?", "cr_notification", "plannedsubjdrug", "進捗に伴う変更は終了/中止時でOK"),
    ("$.plannedSubjTotal", "plannedSubjTotal", "number?", "cr_notification", "plannedsubjtotal", ""),
    ("$.targetDisease", "targetDisease", "string", "cr_notification", "targetdisease", "追加は「変更前」提出時期"),
    ("$.periodStart", "periodStart", "string?", "cr_notification", "periodstart", ""),
    ("$.periodEnd", "periodEnd", "string?", "cr_notification", "periodend", ""),
    ("$.isGlobal", "isGlobal", "boolean", "cr_notification", "isglobal", ""),
    ("$.reasonOnerous", "reasonOnerous", "string?", "cr_notification", "reasononerous", ""),
    ("$.chargeOutPersonName", "chargeOutPersonName", "string?", "cr_notification", "chargeoutperson", ""),
    ("$.validityReasons", "validityReasons", "string?", "cr_notification", "validityreasons", ""),
    ("$.applicBiological", "applicBiological", "number?", "cr_notification", "biological", ""),
    ("$.applicBiologicalDetail", "applicBiologicalDetail", "string?", "cr_notification", "biologicaldetail", ""),
    ("$.applicCartagena", "applicCartagena", "number?", "cr_notification", "cartagena", ""),
    ("$.applicCartagenaDetail", "applicCartagenaDetail", "string?", "cr_notification", "cartagenadetail", ""),
    ("$.applicExpandedAccess", "applicExpandedAccess", "number?", "cr_notification", "expandedaccess", ""),
    ("$.applicExpandedAccessDetail", "applicExpandedAccessDetail", "string?", "cr_notification", "expandedaccessdetail", ""),
    ("$.otherCommentsPrimary", "otherCommentsPrimary", "string?", "cr_notification", "othercommentsprimary", ""),
    ("$.otherCommentsProtocol", "otherCommentsProtocol", "string?", "cr_notification", "othercommentsprotocol", ""),
    ("$.applicCodx", "applicCodx", "number?", "cr_notification", "applicodx", "「その他の情報」該当性トグル"),
    ("$.applicCombinationProd", "applicCombinationProd", "number?", "cr_notification", "combinationprod", ""),
    ("$.applicGeneTest", "applicGeneTest", "number?", "cr_notification", "genetest", ""),
    ("$.applicMicrodose", "applicMicrodose", "number?", "cr_notification", "microdose", ""),
    ("$.applicCombEquipment", "applicCombEquipment", "number?", "cr_notification", "combequipment", ""),
    ("$.combEquipmentContents", "combEquipmentContents", "string?", "cr_notification", "combequipmentcontents", ""),
    ("$.globalContents", "globalContents", "string?", "cr_notification", "globalcontents", ""),
    ("$.formVersion", "formVersion", "string?", "cr_notification", "formversion", ""),
    ("$.foreignName", "foreignName", "string?", "cr_notification", "foreignname", "海外依頼者・外国製造業者（邦文）"),
    ("$.foreignRepName", "foreignRepName", "string?", "cr_notification", "foreignrepname", ""),
    ("$.foreignAddress1", "foreignAddress1", "string?", "cr_notification", "foreignaddress1", ""),
    ("$.foreignAddress2", "foreignAddress2", "string?", "cr_notification", "foreignaddress2", ""),
    ("$.foreignNameFrgn", "foreignNameFrgn", "string?", "cr_notification", "foreignnamefrgn", "同（外国文）"),
    ("$.foreignRepNameFrgn", "foreignRepNameFrgn", "string?", "cr_notification", "foreignrepnamefrgn", ""),
    ("$.foreignAddress1Frgn", "foreignAddress1Frgn", "string?", "cr_notification", "foreignaddress1frgn", ""),
    ("$.foreignAddress2Frgn", "foreignAddress2Frgn", "string?", "cr_notification", "foreignaddress2frgn", ""),
    ("$.croName", "croName", "string?", "cr_notification", "croname", "変更・追加・削除は「変更後6ヶ月以内」"),
    ("$.croAddress1", "croAddress1", "string?", "cr_notification", "croaddress1", ""),
    ("$.croAddress2", "croAddress2", "string?", "cr_notification", "croaddress2", ""),
    ("$.croService", "croService", "string?", "cr_notification", "croservice", ""),
    ("$.coordName", "coordName", "string?", "cr_notification", "coordname", "治験調整医師"),
    ("$.coordAffiliation", "coordAffiliation", "string?", "cr_notification", "coordaffiliation", ""),
    ("$.coordInstitution", "coordInstitution", "string?", "cr_notification", "coordinstitution", ""),
    ("$.remarks", "remarks", "string?", "cr_notification", "remarks", "★バイト数検証の対象（2000バイト）"),
    ("$.footnote", "footnote", "string?", "cr_notification", "footnote", "★バイト数検証の対象（1024バイト）"),
    ("$.gwReceptNo", "gwReceptNo", "string?", "cr_notification", "gwreceptno", ""),
    ("$.sponsorId", "sponsorId", "string", "cr_notification", "sponsorid", ""),
    ("$.createdBy", "createdBy", "string", None, None, "★職務分離の判定に使用。昇格列と二重保持"),
    ("$.createdAt", "createdAt", "string", None, None, ""),
    ("$.reviewedBy", "reviewedBy", "string?", None, None, ""),
    ("$.approvedBy", "approvedBy", "string?", None, None, "★起票者と異なることを強制"),
    ("$.approvedAt", "approvedAt", "string?", None, None, ""),
    ("$.submittedAt", "submittedAt", "string?", None, None, ""),
    ("$.xmlGeneratedAt", "xmlGeneratedAt", "string?", None, None, ""),
]
drug = [
    ("$.studyDrugs[]", "（配列）", "StudyDrug[]", None, None, "主たる被験薬＋その他治験使用薬。順序番号＝突合キー型"),
    ("$.studyDrugs[].id", "id", "string", None, None, ""),
    ("$.studyDrugs[].drugRole", "drugRole", "number", "cr_studydrug", "drugrole", "主たる被験薬 / その他治験使用薬"),
    ("$.studyDrugs[].serialNo", "serialNo", "number", "cr_studydrug", "serialno",
     "★突合キー型。シリーズ内で不変・欠番可・再付番禁止。計画→終了まで同じ番号を維持"),
    ("$.studyDrugs[].drugName", "drugName", "string", "cr_studydrug", "drugname", ""),
    ("$.studyDrugs[].productCategory", "productCategory", "number?", "cr_studydrug", "productcategory", ""),
    ("$.studyDrugs[].idType", "idType", "string?", "cr_studydrug", "idtype", ""),
    ("$.studyDrugs[].idTypeDetail", "idTypeDetail", "string?", "cr_studydrug", "idtypedetail", ""),
    ("$.studyDrugs[].combCategory", "combCategory", "number?", "cr_studydrug", "combcategory", ""),
    ("$.studyDrugs[].combCategoryOther", "combCategoryOther", "string?", "cr_studydrug", "combcategoryother", ""),
    ("$.studyDrugs[].applicationStatus", "applicationStatus", "string?", "cr_studydrug", "applicationstatus", ""),
    ("$.studyDrugs[].drugSubj30dayReview", "drugSubj30dayReview", "number?", "cr_studydrug", "drugsubj30dayreview", ""),
    ("$.studyDrugs[].drugTargetDisease", "drugTargetDisease", "string?", "cr_studydrug", "drugtargetdisease", ""),
    ("$.studyDrugs[].drugApplicCartagena", "drugApplicCartagena", "number?", "cr_studydrug", "drugcartagena", ""),
    ("$.studyDrugs[].drugApplicBiological", "drugApplicBiological", "number?", "cr_studydrug", "drugbiological", ""),
    ("$.studyDrugs[].drugApplicCodx", "drugApplicCodx", "number?", "cr_studydrug", "drugcodx", ""),
    ("$.studyDrugs[].drugApplicCombinationProd", "drugApplicCombinationProd", "number?", "cr_studydrug", "drugcombinationprod", ""),
    ("$.studyDrugs[].drugRemarks", "drugRemarks", "string?", "cr_studydrug", "drugremarks", ""),
    ("$.studyDrugs[].foreignName", "foreignName", "string?", "cr_studydrug", "combforeignname", "薬別の海外依頼者（邦文）"),
    ("$.studyDrugs[].foreignRepName", "foreignRepName", "string?", "cr_studydrug", "combforeignrepname", ""),
    ("$.studyDrugs[].foreignAddress1", "foreignAddress1", "string?", "cr_studydrug", "combforeignaddress1", ""),
    ("$.studyDrugs[].foreignAddress2", "foreignAddress2", "string?", "cr_studydrug", "combforeignaddress2", ""),
    ("$.studyDrugs[].foreignNameFrgn", "foreignNameFrgn", "string?", "cr_studydrug", "combforeignnamefrgn", "同（外国文）"),
    ("$.studyDrugs[].foreignRepNameFrgn", "foreignRepNameFrgn", "string?", "cr_studydrug", "combforeignrepnamefrgn", ""),
    ("$.studyDrugs[].foreignAddress1Frgn", "foreignAddress1Frgn", "string?", "cr_studydrug", "combforeignaddress1frgn", ""),
    ("$.studyDrugs[].foreignAddress2Frgn", "foreignAddress2Frgn", "string?", "cr_studydrug", "combforeignaddress2frgn", ""),
    ("$.studyDrugs[].adrReport", "adrReport", "string?", "cr_studydrug", "adrreport", ""),
    ("$.studyDrugs[].plantName", "plantName", "string", "cr_studydrug", "plantname", "実態変更を伴わない名称変更は「変更後6ヶ月以内」"),
    ("$.studyDrugs[].plantAddress1", "plantAddress1", "string", "cr_studydrug", "plantaddress1", ""),
    ("$.studyDrugs[].plantAddress2", "plantAddress2", "string", "cr_studydrug", "plantaddress2", ""),
    ("$.studyDrugs[].plantCode", "plantCode", "string", "cr_studydrug", "plantcode", "★コード表突合検証の対象"),
    ("$.studyDrugs[].ingredients", "ingredients", "string", "cr_studydrug", "ingredients", ""),
    ("$.studyDrugs[].manufactMethod", "manufactMethod", "string?", "cr_studydrug", "manufactmethod", ""),
    ("$.studyDrugs[].intendEffects", "intendEffects", "string", "cr_studydrug", "intendeffects", ""),
    ("$.studyDrugs[].efficacyClassCode", "efficacyClassCode", "string", "cr_studydrug", "efficacyclasscode", "★コード表突合検証の対象"),
    ("$.studyDrugs[].intendDosage", "intendDosage", "string", "cr_studydrug", "intenddosage", ""),
    ("$.studyDrugs[].dosageAdmin", "dosageAdmin", "string?", "cr_studydrug", "dosageadmin", ""),
    ("$.studyDrugs[].dosageFormCode", "dosageFormCode", "string?", "cr_studydrug", "dosageformcode", "★コード表突合検証の対象"),
    ("$.studyDrugs[].adminRouteCode", "adminRouteCode", "string?", "cr_studydrug", "adminroutecode", ""),
]
site = [
    ("$.sites[]", "（配列）", "Site[]", None, None, "届出ごとの実施医療機関。医師ロスターと数量を内包"),
    ("$.sites[].id", "id", "string", None, None, ""),
    ("$.sites[].institutionId", "institutionId", "string", "cr_site", "institutionid", "CtnInstitutions への参照（Payload 内は id 文字列）"),
    ("$.sites[].serialNo", "serialNo", "number", "cr_site", "serialno", "SERIALNO1"),
    ("$.sites[].department", "department", "string", "cr_site", "department", ""),
    ("$.sites[].plannedSubjects", "plannedSubjects", "number", "cr_site", "plannedsubjects", ""),
    ("$.sites[].enrolledSubjects", "enrolledSubjects", "number?", "cr_site", "enrolledsubjects", "終了/中止で必須"),
    ("$.sites[].irbId", "irbId", "string", "cr_site", "irbid", "CtnIrbs への参照"),
    ("$.sites[].smoName", "smoName", "string?", "cr_site", "smoname", ""),
    ("$.sites[].smoAddress1", "smoAddress1", "string?", "cr_site", "smoaddress1", ""),
    ("$.sites[].smoAddress2", "smoAddress2", "string?", "cr_site", "smoaddress2", ""),
    ("$.sites[].smoService", "smoService", "string?", "cr_site", "smoservice", ""),
    ("$.sites[].others", "others", "string?", "cr_site", "others", ""),
    ("$.sites[].crcStaffId", "crcStaffId", "string?", None, None, "CtnSiteStaff への参照。XML対象外・運用情報"),
]
inv = [
    ("$.sites[].investigators[]", "（配列）", "Investigator[]", None, None,
     "★イベント行型。同一人物の複数行を許容し、物理削除しない（履歴として残す）"),
    ("$.sites[].investigators[].id", "id", "string", None, None, ""),
    ("$.sites[].investigators[].doctorId", "doctorId", "string", "cr_investigator", "doctorid", "CtnDoctors の不変ID"),
    ("$.sites[].investigators[].doctorRole", "doctorRole", "number", "cr_investigator", "doctorrole", "責任医師 / 分担医師"),
    ("$.sites[].investigators[].serialNo", "serialNo", "number", "cr_investigator", "serialno",
     "★イベント行型の採番。届内・イベント単位で付番。突合キー型（治験使用薬）とは完全に分離する"),
    ("$.sites[].investigators[].changeType", "changeType", "number", "cr_investigator", "changetype", "登録/追加/削除/変更"),
    ("$.sites[].investigators[].changeDate", "changeDate", "string?", "cr_investigator", "changedate", "変更届のみ"),
    ("$.sites[].investigators[].changeReason", "changeReason", "string?", "cr_investigator", "changereason", ""),
    ("$.sites[].investigators[].nameOriginal", "nameOriginal", "string", "cr_investigator", "nameoriginal", "★医師マスタからのスナップショット（届出時点の値を凍結）"),
    ("$.sites[].investigators[].nameFiling", "nameFiling", "string", "cr_investigator", "namefiling", "同上"),
    ("$.sites[].investigators[].pronounce", "pronounce", "string", "cr_investigator", "pronounce", "同上"),
    ("$.sites[].investigators[].medSchoolNo", "medSchoolNo", "string", "cr_investigator", "medschoolno", "同上"),
    ("$.sites[].investigators[].graduationYear", "graduationYear", "string", "cr_investigator", "graduationyear", "同上"),
]
qty = [
    ("$.sites[].quantities[]", "（配列）", "SiteDrugQty[]", None, None, "施設×治験使用薬の交差"),
    ("$.sites[].quantities[].studyDrugId", "studyDrugId", "string", "cr_sitedrugqty", "studydrugid", ""),
    ("$.sites[].quantities[].serialNo", "serialNo", "number", "cr_sitedrugqty", "serialno", "★治験使用薬の順序番号を継承（独自採番しない）"),
    ("$.sites[].quantities[].qtyPlanned", "qtyPlanned", "number", "cr_sitedrugqty", "qtyplanned", "予定交付数量。進捗に伴う変更は終了/中止時でOK"),
    ("$.sites[].quantities[].qtyNotation", "qtyNotation", "string?", "cr_sitedrugqty", "qtynotation", ""),
    ("$.sites[].quantities[].qtySupplied", "qtySupplied", "number?", "cr_sitedrugqty", "qtysupplied", "終了/中止のみ必須"),
    ("$.sites[].quantities[].qtyUsed", "qtyUsed", "number?", "cr_sitedrugqty", "qtyused", "同上"),
    ("$.sites[].quantities[].qtyWithdrawn", "qtyWithdrawn", "number?", "cr_sitedrugqty", "qtywithdrawn", "同上"),
    ("$.sites[].quantities[].qtyAbrogated", "qtyAbrogated", "number?", "cr_sitedrugqty", "qtyabrogated", "同上"),
]
att = [
    ("$.attachments[]", "（配列）", "Attachment[]", None, None, "メタデータのみ。実ファイルは将来フェーズで CtnAttachmentFiles へ"),
    ("$.attachments[].id", "id", "string", None, None, ""),
    ("$.attachments[].docType", "docType", "number", "cr_attachment", "doctype", ""),
    ("$.attachments[].docName", "docName", "string", "cr_attachment", "docname", ""),
    ("$.attachments[].spReference", "spReference", "string", "cr_attachment", "spreference", "ドキュメントライブラリのURL"),
    ("$.attachments[].hasBookmarks", "hasBookmarks", "boolean", "cr_attachment", "hasbookmarks", ""),
    ("$.attachments[].hasText", "hasText", "boolean", "cr_attachment", "hastext", ""),
    ("$.attachments[].attachStatus", "attachStatus", "number", "cr_attachment", "attachstatus", ""),
]
ref = [
    ("$.references[]", "（配列）", "ReferenceNote[]", None, None, "参照する治験届出情報"),
    ("$.references[].id", "id", "string", None, None, ""),
    ("$.references[].serialNo", "serialNo", "number", "cr_reference", "serialno", ""),
    ("$.references[].refCategory", "refCategory", "string", "cr_reference", "refcategory", ""),
    ("$.references[].refCode", "refCode", "string", "cr_reference", "refcode", ""),
    ("$.references[].refCount", "refCount", "string", "cr_reference", "refcount", ""),
    ("$.references[].refType", "refType", "string", "cr_reference", "reftype", ""),
    ("$.references[].refContents", "refContents", "string", "cr_reference", "refcontents", ""),
]
inq = [
    ("$.inquiries[]", "（配列）", "Inquiry[]", None, None, "PMDA照会対応（提出後管理・XML対象外）"),
    ("$.inquiries[].id", "id", "string", None, None, ""),
    ("$.inquiries[].inquiryDate", "inquiryDate", "string", "cr_inquiry", "inquirydate", ""),
    ("$.inquiries[].inquiryContent", "inquiryContent", "string", "cr_inquiry", "inquirycontent", ""),
    ("$.inquiries[].responseDeadline", "responseDeadline", "string", "cr_inquiry", "responsedeadline", "★回答期限リマインダの起点"),
    ("$.inquiries[].responseDate", "responseDate", "string?", "cr_inquiry", "responsedate", ""),
    ("$.inquiries[].responseContent", "responseContent", "string?", "cr_inquiry", "responsecontent", ""),
    ("$.inquiries[].hasReplacement", "hasReplacement", "boolean", "cr_inquiry", "hasreplacement", ""),
]

promoted = {
    "compoundId", "notifType", "filingCount", "changeCount", "status", "kubun",
    "protocolNo", "noteDate", "plannedStartDate", "createdBy", "approvedBy",
    "reviewedBy", "approvedAt", "submittedAt", "xmlGeneratedAt", "id",
}
prows = []
for group, label_ in ((pay, "届（ルート）"), (drug, "治験使用薬"), (site, "実施医療機関"),
                      (inv, "医師（イベント行）"), (qty, "施設別数量"), (att, "添付資料"),
                      (ref, "参照治験届出"), (inq, "PMDA照会")):
    for path, prop, tstype, tbl, ov, note in group:
        dvname, reqby, xsd, status = dv_cell(tbl, prop, ov) if tbl else ("—", "—", "—", "")
        prows.append((
            label_, path, prop, tstype,
            "○" if (label_ == "届（ルート）" and prop in promoted) else "",
            reqby, dvname, xsd, status, note,
        ))
last = table(ws, ["グループ", "JSONパス", "プロパティ", "TS型", "昇格列",
                  "必須(計/変/中/終/開)", "対応Dataverse列", "XSD要素", "設計状態", "備考"],
             prows, 5,
             widths=[18, 42, 26, 18, 8, 20, 26, 34, 10, 56],
             wrap_cols=("備考",))
for r in range(6, last + 1):
    if ws.cell(row=r, column=9).value == "要確認":
        for c in range(1, 11):
            ws.cell(row=r, column=c).fill = WARN_FILL

# ===========================================================================
# 04_リレーション
# ===========================================================================
ws = sheet(wb, "04_リレーション", "参照（Lookup）設計と参照整合性",
           "Dataverse 構想の16リレーションのうち、届の子要素にあたる7本は集約JSONの入れ子に吸収される（Lookup を作らない）。")
rel = [
    ("R1", "CtnCompounds", "CtnNotifications", "1:N", "CtnCompound", "参照", "削除制限",
     "親（成分）の削除は禁止。届が1件でも存在する成分は削除不可とし、履歴を保持する。"
     "★届出回数の通算はこの親単位で行う（フラットな通し番号ではない）"),
    ("R2", "CtnSponsors", "CtnNotifications", "1:N", "（Payload 内 sponsorId）", "参照", "—",
     "一覧で絞り込む要件が無いため昇格しない。マスタは論理削除のみで参照切れを起こさない"),
    ("R3", "CtnSponsors", "CtnCompounds", "1:N", "CtnSponsor", "参照", "マスタ保護", ""),
    ("R4", "CtnInstitutions", "CtnDoctors", "1:N", "CtnInstitution", "参照", "マスタ保護", "主たる所属（運用・表示用）"),
    ("R5", "CtnInstitutions", "CtnSiteStaff", "1:N", "CtnInstitution", "参照", "マスタ保護", ""),
    ("R6", "CtnDoctors", "CtnGaiji", "1:N", "CtnDoctor", "参照", "マスタ保護", "医師ごとの外字確認履歴"),
    ("R7", "CtnNotifications", "CtnGaiji", "1:N", "CtnNotification", "参照", "—", "検出が発生した届の記録（任意）"),
    ("R8", "CtnNotifications", "CtnAttachmentFiles", "1:N", "CtnNotification", "参照", "—", "将来フェーズ"),
    ("—", "CtnNotifications", "治験使用薬", "1:N", "（集約JSON $.studyDrugs[]）", "入れ子", "親と一体",
     "★Lookup を作らない。トランザクションが無い SharePoint で保存の原子性を確保するため"),
    ("—", "CtnNotifications", "実施医療機関", "1:N", "（集約JSON $.sites[]）", "入れ子", "親と一体", "同上"),
    ("—", "実施医療機関", "治験責任医師・分担医師", "1:N", "（集約JSON $.sites[].investigators[]）", "入れ子", "親と一体", "同上"),
    ("—", "実施医療機関", "施設別治験薬数量", "1:N", "（集約JSON $.sites[].quantities[]）", "入れ子", "親と一体", "同上"),
    ("—", "治験使用薬", "施設別治験薬数量", "1:N", "（serialNo による論理参照）", "入れ子", "—",
     "順序番号の継承元。JSON 内で serialNo により突合する"),
    ("—", "CtnNotifications", "添付資料", "1:N", "（集約JSON $.attachments[]）", "入れ子", "親と一体", "同上"),
    ("—", "CtnNotifications", "参照治験届出", "1:N", "（集約JSON $.references[]）", "入れ子", "親と一体", "同上"),
    ("—", "CtnNotifications", "PMDA照会対応", "1:N", "（集約JSON $.inquiries[]）", "入れ子", "親と一体", "同上"),
    ("—", "CtnInstitutions / CtnIrbs / CtnDoctors", "実施医療機関・医師", "参照", "（Payload 内 id 文字列）", "論理参照", "—",
     "★Payload 内はマスタのアイテムID（文字列）で参照する。Lookup 列にしないため参照整合性は"
     "アプリ層で担保（マスタは論理削除のみ・物理削除しないことが前提）"),
]
table(ws, ["No", "親", "子", "多重度", "参照列 / 格納方法", "実装方式", "削除動作", "備考"],
      rel, 4,
      widths=[6, 30, 30, 10, 40, 12, 14, 78],
      wrap_cols=("備考",))

# ===========================================================================
# 05_選択肢マスタ
# ===========================================================================
ws = sheet(wb, "05_選択肢マスタ", "選択肢（Choice）定義",
           "ctn-schema.json の choices（16セット）。数値コードは Dataverse 構想の値をそのまま維持し XML 生成の互換を保つ。"
           "ラベルのハードコードは禁止（schema.ts の choiceLabel() で引く）。")
STORE = {
    "届出種別": "CtnNotifications.CtnNotifType（選択肢・文字列キー）＋ Payload（数値）",
    "ステータス": "CtnNotifications.CtnStatus（選択肢・文字列キー）＋ Payload（数値）",
    "届出区分": "CtnNotifications.CtnKubun（数値）",
    "対象区分": "CtnCompounds.CtnTargetCategory（数値）",
    "開発状態": "CtnCompounds.CtnDevStatus（数値）",
    "IRB区分": "CtnIrbs.CtnIrbType（数値）",
    "外字判定区分": "CtnGaiji.CtnGaijiType（数値）",
    "資料種別": "Payload $.attachments[].docType（数値）",
    "添付ステータス": "Payload $.attachments[].attachStatus（数値）",
    "主従区分": "Payload $.studyDrugs[].drugRole（数値）",
    "薬剤区別": "Payload $.studyDrugs[].combCategory（数値）",
    "医師区分": "Payload $.sites[].investigators[].doctorRole（数値）",
    "異動区分": "Payload $.sites[].investigators[].changeType（数値）",
    "開発の相": "Payload $.phase（数値）",
    "試験の種類": "Payload $.trialType（数値）",
    "変更箇所（複数選択）": "Payload $.changeLocations（数値配列）",
}
crows = []
for cs in schema["choices"]:
    for v in cs["values"]:
        crows.append((cs["setName"], v["label"], v["value"],
                      STORE.get(cs["setName"], "—"), cs.get("note") or ""))
table(ws, ["選択肢セット", "ラベル", "コード値", "格納先", "備考"], crows, 5,
      widths=[26, 44, 14, 62, 70], wrap_cols=("備考", "格納先"))

# ===========================================================================
# 06_ロジック実装マップ
# ===========================================================================
ws = sheet(wb, "06_ロジック実装マップ", "サーバーロジック 16件の実装マッピング",
           "Dataverse 構想ではプラグイン／数式列が強制するロジックを、SharePoint（SPFx）構成でどこに置くか。"
           "強制力の欄が「アプリ層」のものはリスト直編集で迂回されうる（00_設計方針 §3 参照）。")
impl = {
    "30日調査対象の判定": ("logic.ts is30DayReview()", "リポジトリ層（保存時に昇格列 CtnIs30DayReview へ再計算）＋表示時に都度算出",
                          "アプリ層", "計画届∧届出回数=1 → 真。変更届∧届出区分=1 → 真。中止/終了/開発中止 → 偽"),
    "提出期限の算定": ("logic.ts computeDeadline()", "リポジトリ層（保存時に昇格列 CtnDeadline へ再計算）＋ derive.ts が都度算出",
                     "アプリ層", "計画届: 開始予定日 −30日(30日調査) / −14日。変更届: 提出時期4区分（変更前 / 6ヶ月 / 1年 / 終了時）"),
    "届出区分の推奨・確定": ("logic.ts recommendKubun()", "リポジトリ層（保存時に再計算して CtnKubun を確定）。UI は推奨提示のみ",
                          "アプリ層", "変更箇所のうち最も重い区分（1＞2＞3）を採用"),
    "順序番号採番（突合キー型）": ("logic.ts nextStudyDrugSerial() / seriesStudyDrugSerials()",
                              "リポジトリ層。★提出時に「同一シリーズの全届を再取得 → 再計算 → etag付き書き込み → 412ならリトライ」",
                              "アプリ層＋楽観ロック", "シリーズ内で不変・欠番可・再付番禁止。過去に採番衝突バグの前歴あり"),
    "順序番号採番（イベント行型）": ("logic.ts nextInvestigatorSerial()", "リポジトリ層（届内で採番）",
                                "アプリ層", "届内・イベント単位。突合キー型と完全に分離する"),
    "順序番号継承": ("（数量は治験使用薬の serialNo を継承）", "リポジトリ層（Payload 組立時）",
                  "アプリ層", "独自採番しない"),
    "治験成分記号の検証": ("logic.ts validateCompoundCode()", "リポジトリ層（CtnCompounds 保存時）＋ UI 即時表示",
                        "アプリ層＋列の一意制約", "半角英数字・20桁以内・「&」不可。SharePoint の一意インデックスで重複も防ぐ"),
    "外字検出・正規化・記録": ("logic.ts detectGaiji() / normalizeGaiji()", "リポジトリ層（CtnDoctors 保存時）→ CtnGaiji へ追記",
                           "アプリ層", "★人間の確認を必須にする（自動置換のみで完結させない）"),
    "バイト数検証": ("logic.ts checkByteLimit() / BYTE_RULES", "リポジトリ層（保存時）",
                  "アプリ層", "よみかな100 / 脚注1024 / 備考2000 / ファイル名255 バイト（Shift-JIS 近似）"),
    "コード表突合検証": ("（コード表マスタとの突合）", "リポジトリ層。コード表は ctn-schema.json ないし追加リストで保持",
                     "アプリ層", "業者コード・薬効分類番号・剤形コード・大学番号"),
    "職務分離の強制": ("logic.ts canApprove()", "リポジトリ層（承認遷移時）。actor は pageContext の loginName、ロールは CtnAppUsers",
                    "アプリ層", "★起票者は自分の届を承認できない。actor を自己申告にしないことが要件"),
    "提出ゲート": ("logic.ts canSubmit()", "リポジトリ層（提出操作時）",
                 "アプリ層", "ステータス=承認済 でなければ提出不可"),
    "開発状態の更新": ("logic.ts devStatusAfterSubmit()", "リポジトリ層（開発中止届の提出時に CtnCompounds.CtnDevStatus を更新）",
                    "アプリ層", "2アイテムへの書き込みになるため、届の提出成功後に成分を更新し、失敗時は監査へ記録して手動復旧"),
    "終了・中止の早期クローズ": ("derive.ts seriesClosedAfter()", "リポジトリ層／ダッシュボード派生",
                            "アプリ層", "終了・中止届の提出で定期報告バッチの保留をクリア"),
    "集計ロールアップ": ("derive.ts dashboardStats() / seriesSummaries()", "クライアント集計（全件取得後にメモリ内で算出）",
                     "—", "現規模（数百件）では十分。閾値超過時は $select 分離・ページングへ"),
    "XML生成・XSD検証": ("xml.ts", "クライアント（ブラウザ内で生成・検証）。生成日時のみ CtnXmlGeneratedAt へ記録",
                      "—", "Dataverse 構想では Azure Functions。SPFx 版は純粋関数をそのまま利用する"),
}
lrows = []
for i, sl in enumerate(schema["serverLogic"], start=1):
    fn, where, force, note = impl.get(sl["name"], ("—", "—", "—", ""))
    lrows.append((i, sl["name"], sl["implementation"], sl["targetTable"], sl["trigger"],
                  where, fn, force, sl.get("gampCategory", ""), sl.get("oqTarget", ""), note))
# --- ctn-schema.json の serverLogic には無いが、実装済み／設計上必要なもの（2026-07-26 追記） ---
lrows.append((17, "届書PDF生成（社内レビュー用）", "（構想に無し）", "治験届", "提出パッケージ出力の操作時",
              "クライアント。PrintableNotification を html2canvas でラスタライズ → pdf-lib でページ化",
              "output.ts generateSubmissionPackage()", "—", "Cat 5", "○",
              "★現行は社内レビュー用。ラスタライズのためテキスト選択不可。"
              "PMDA 提出用へ格上げする際は Word テンプレート＋SharePoint のファイル変換によるサーバー側生成へ切り替える"))
lrows.append((18, "提出パッケージ結合", "（構想に無し）", "治験届＋添付", "提出パッケージ出力の操作時",
              "クライアント。資料種別「検査キット/パッキングリスト」(100001208) の実PDFを届書PDFへ結合",
              "output.ts generateSubmissionPackage()", "—", "Cat 5", "○",
              "★デモはサンプルPDFを生成。本番で実ファイルを結合する段階で CtnAttachmentFiles が必須になる"))
table(ws, ["No", "ロジック名", "Dataverse構想の実装", "対象", "契機",
           "SharePoint版の実装点", "該当関数", "強制力", "GAMP", "OQ", "補足"],
      lrows, 5,
      widths=[5, 26, 26, 22, 22, 58, 40, 18, 8, 6, 62],
      wrap_cols=("SharePoint版の実装点", "補足", "該当関数", "ロジック名"))

# ===========================================================================
# 07_画面データ連携
# ===========================================================================
ws = sheet(wb, "07_画面データ連携", "画面 ⇄ リストのデータ連携",
           "SP REST は spHttpClient（Accept: application/json;odata=nometadata）。更新は POST + X-HTTP-Method: MERGE + IF-MATCH（実 etag・'*' 禁止）。")
ui = [
    ("初期ロード", "全画面", "getState()", "全11リストを並列 GET（Promise.all）。CtnNotifications は CtnPayload を JSON.parse",
     "—", "GET /items?$select=...&$top=500", "—",
     "アイテムID（数値）→ ドメイン id（文字列）の変換はリポジトリ境界で完結させる"),
    ("ダッシュボード", "アラート／リマインダ表示", "—（読み取りのみ）", "CtnNotifications, CtnSettings", "—", "—",
     "derive.ts deriveAlerts()", "永続化しない派生データ。提出期限・PMDA照会期限・提出待ち・定期報告保留の4種"),
    ("ダッシュボード", "KPI集計", "—", "CtnNotifications, CtnCompounds", "—", "—",
     "derive.ts dashboardStats()", "クライアント集計"),
    ("治験届一覧", "絞り込み・並べ替え", "—", "CtnNotifications（昇格列のみ）", "—", "GET（$filter は昇格列に対して）",
     "—", "★Payload をパースせずに一覧を描けることが昇格列の存在理由"),
    ("新規届作成ウィザード", "シリーズ選択→種別選択→作成", "createNotification()", "CtnCompounds（読）",
     "CtnNotifications（作成）, CtnAudit（追記）", "POST /items",
     "採番（届出回数／変更回数）", "★計画届は届出回数 +1。変更届は対象プロトコールの届出回数を継承し変更回数を +1"),
    ("新規届作成ウィザード", "新規シリーズ登録", "createCompound()", "—", "CtnCompounds（作成）, CtnAudit",
     "POST /items", "validateCompoundCode()", "治験成分記号の一意制約に違反した場合は 400 を捕捉してUIへ返す"),
    ("治験届 詳細", "保存", "updateNotification(n)", "CtnNotifications（etag取得）",
     "CtnNotifications（更新）, CtnAudit", "POST /items({id}) + MERGE + IF-MATCH",
     "区分再計算・期限再計算・バイト数検証・コード表突合",
     "★CtnPayload と全昇格列を同一の書き込みで更新する。412 は再取得して競合をユーザーに提示"),
    ("治験届 詳細", "レビュー依頼", "sendForReview()", "CtnNotifications", "CtnNotifications（状態）, CtnAudit",
     "MERGE", "状態遷移検証", "draft → review"),
    ("治験届 詳細", "承認", "approveNotification()", "CtnNotifications, CtnAppUsers",
     "CtnNotifications（状態・承認者）, CtnAudit", "MERGE", "canApprove()（職務分離）",
     "★起票者＝承認者なら拒否。actor は pageContext の loginName"),
    ("治験届 詳細", "提出", "submitNotification()", "CtnNotifications（同一シリーズ全件を再取得）",
     "CtnNotifications（状態・提出日時・順序番号確定）, CtnCompounds（開発中止届のみ）, CtnAudit",
     "MERGE + IF-MATCH（412リトライ）", "canSubmit() / 順序番号確定 / devStatusAfterSubmit()",
     "★最も競合しやすい操作。再取得→再計算→書き込み→412ならリトライのループで採番衝突を防ぐ"),
    ("治験届 詳細", "削除", "deleteNotification()", "CtnNotifications", "CtnNotifications（削除）, CtnAudit",
     "POST + X-HTTP-Method: DELETE", "下書きのみ許可", "提出済は削除不可"),
    ("XMLプレビュー", "生成・XSD検証・生成日時記録", "markXmlGenerated()", "CtnNotifications 一式",
     "CtnNotifications（CtnXmlGeneratedAt）, CtnAudit", "MERGE", "xml.ts",
     "生成・検証はブラウザ内で完結。ファイルはダウンロード"),
    ("治験届 詳細", "提出パッケージ出力（届書PDF＋CTN XML）", "（新規）saveGeneratedOutput()",
     "CtnNotifications 一式, CtnAttachmentFiles（実ファイル結合時）",
     "CtnGeneratedOutputs（アップロード）, CtnNotifications（CtnPdfGeneratedAt / CtnXmlGeneratedAt）, CtnAudit",
     "POST /Files/add + MERGE", "output.ts generateSubmissionPackage() / xml.ts",
     "★現行の届書PDFは社内レビュー用（ラスタライズ）。生成物は上書きせず版を積む。"
     "PMDA 提出用へ格上げする際はサーバー側生成（Word テンプレート＋ファイル変換）へ切り替える"),
    ("マスタ管理", "医療機関・医師・IRB・届出者・現場担当のCRUD", "create/update/setXxxActive()",
     "各マスタリスト", "各マスタリスト, CtnAudit（＋医師は CtnGaiji）", "POST / MERGE",
     "detectGaiji()（医師のみ）", "★物理削除しない。無効化は CtnActive=いいえ"),
    ("外字確認ダイアログ", "代替字の確認・記録", "addGaijiRecord()", "CtnDoctors", "CtnGaiji（追記）, CtnDoctors（届出用表記）",
     "POST /items", "normalizeGaiji()", "人間の確認結果を記録してから届出用表記を確定する"),
    ("データ取り込み", "既存XMLの読込→ドラフト化", "createNotification() + updateNotification()",
     "CtnCompounds", "CtnCompounds（無ければ作成）, CtnNotifications, CtnAudit", "POST / MERGE",
     "XMLパース", "取り込み結果は必ず下書き。提出前に人間が補完する"),
    ("ロジカルチェック設定", "閾値・有効/無効の変更", "（新規）updateSettings()", "CtnSettings",
     "CtnSettings（更新）, CtnAudit", "MERGE", "—",
     "★全利用者共通の設定。更新は薬事担当ロールに限定し、変更は監査へ記録する"),
    ("監査ログ", "一覧・絞り込み", "—（読み取りのみ）", "CtnAudit", "—",
     "GET（$filter=CtnAt ge ...&$top=...）", "—", "★5,000件しきい値の主要対策対象。CtnAt にインデックス必須"),
]
table(ws, ["画面", "操作", "リポジトリメソッド", "読み取り", "書き込み", "SP REST", "経由するロジック", "備考"],
      ui, 5,
      widths=[22, 34, 30, 40, 48, 40, 34, 76],
      wrap_cols=("読み取り", "書き込み", "備考", "SP REST", "経由するロジック", "操作"))

# ===========================================================================
# 08_制限対策
# ===========================================================================
ws = sheet(wb, "08_制限対策", "SharePoint の制限と本設計での対処",
           "Dataverse には無い SharePoint 固有の制約。設計上の判断根拠として明示する。")
lim = [
    ("リスト ビューしきい値", "5,000アイテム",
     "CtnAudit が数年運用で超過する。CtnNotifications は数百〜2,000 で通常は下回る",
     "★対象列（CtnAt / CtnWho / CtnAction）にインデックスを作成。既定ビューは期間フィルタ付きで 5,000 未満に収める。"
     "年次アーカイブ（別リストへ移送）を運用手順に含める"),
    ("リスト横断トランザクション", "無し",
     "届の保存を複数リストに分けると非原子的になり、採番・XML生成の前提が壊れる",
     "★集約JSON（CtnPayload）で「1アイテム1書き込み」に集約する。これが本設計の中核判断"),
    ("複数行テキストの上限", "実質的に大きいが、$filter・並べ替え・インデックス不可",
     "CtnPayload では絞り込みができない",
     "一覧・ダッシュボードで必要な項目を昇格列として投影する（正本は Payload のまま）"),
    ("リッチテキスト列のHTMLエスケープ", "—",
     "CtnPayload をリッチテキストにするとJSONが壊れる",
     "★複数行テキストは必ず「プレーンテキスト（追記なし）」で作成する"),
    ("Lookup 列の数", "推奨 8列 / ビューあたり 12件のしきい値",
     "14テーブル正規化なら容易に超過する",
     "集約JSONにより Lookup は最大 2〜3列に収まる"),
    ("日付型のタイムゾーン変換", "サイトのロケール／ユーザー設定に依存",
     "届出年月日・提出期限が1日ずれると30日調査・提出期限の判断を誤る",
     "★日付型を使わず YYYY-MM-DD 文字列で保持する。ソートは辞書順で正しく機能する"),
    ("計算列の制約", "他リスト参照・Today/Me が使えない",
     "提出期限（開始予定日−30/14日）や30日調査判定を計算列で実装できない",
     "リポジトリ層で再計算し、結果を昇格列へ書き込む（CtnDeadline / CtnIs30DayReview）"),
    ("列内部名の予約語", "Title / Status / Order / Owner / Created / Modified / Author / Editor ほか",
     "衝突すると作成失敗または想定外の挙動",
     "★全業務列に Ctn プレフィックスを付ける"),
    ("内部名の日本語", "%E3%81%82... のようにエンコードされる",
     "REST の $select が読みにくくなり保守性を損なう",
     "★内部名は必ず半角英数（表示名のみ日本語）で作成する"),
    ("一意制約", "インデックス列にのみ設定可。複数行テキスト・複数選択は不可",
     "治験成分記号・機関コード・医師表示IDの重複防止",
     "単一行テキストへ一意インデックスを設定。届出回数の一意性（成分×回数）は複合キーが張れないためアプリ層で担保"),
    ("同時実行制御", "etag（楽観ロック）のみ。悲観ロック無し",
     "★採番衝突の主因。過去に前歴あり",
     "IF-MATCH に実 etag を使用（'*' 禁止）。提出時は再取得→再計算→書き込み→412リトライのループ"),
    ("サーバー側ロジック", "プラグイン相当が無い（Power Automate は非同期）",
     "検証・採番の強制がブラウザ内に留まり、リスト直編集で迂回されうる",
     "書き込み経路をリポジトリ層に一本化。リストをナビゲーションから隠す・編集権限を限定・バージョン管理で事後検知。"
     "恒久策は Dataverse 移行"),
    ("REST の一括取得上限", "$top は既定100・最大5,000",
     "全件取得の getState() が影響を受ける",
     "$top=500 とページング。現規模では1回で収まる"),
    ("クライアント側PDF生成の限界", "SPFx はブラウザ内実行のみ",
     "html2canvas によるラスタライズPDFはテキストを含まない。"
     "★ctn-schema.json が cr_hastext（テキスト含有チェック）を PDF 品質要件として持つことと矛盾する",
     "社内レビュー用途では許容。PMDA 提出用へ格上げする際は Word テンプレート＋SharePoint の"
     "「ファイルの変換」（標準コネクタ・追加費用なし）によるサーバー側生成へ切り替える"),
    ("バンドルサイズ", "SPFx はバンドルが大きいと初期表示が遅い",
     "pdf-lib + html2canvas の追加で自己完結デモが約450KB → 約1,081KB に増加",
     "現規模では許容。日本語フォント埋め込み（Noto Sans JP で数MB増）は行わない。"
     "サーバー側生成へ移せばクライアントから両ライブラリを外せる"),
    ("添付ファイル", "リストアイテムの添付は検索・メタデータ管理に弱い",
     "Protocol / IB / ICF の版管理・しおり有無チェックに不足",
     "ドキュメントライブラリ（CtnAttachmentFiles）＋メタデータ列で管理（将来フェーズ）"),
]
table(ws, ["制限項目", "値・仕様", "本設計への影響", "対処"], lim, 5,
      widths=[30, 40, 56, 92], wrap_cols=("本設計への影響", "対処", "値・仕様"))

# ===========================================================================
# 09_権限・監査
# ===========================================================================
ws = sheet(wb, "09_権限・監査", "権限設計と監査証跡")
perm = [
    ("サイト", "CTN Suite 専用サイト（チームサイト）", "所有者=システム管理者 / メンバー=全利用者（約31名） / 閲覧者=監査担当",
     "★リストは既定でサイトナビゲーションから隠す。SharePoint 標準UIでの直接編集を運用上抑止する"),
    ("CtnNotifications", "編集（全メンバー）", "作成・更新は全メンバー。承認・提出はアプリ層でロール判定",
     "SharePoint 権限だけでは職務分離を表現できないため、CtnAppUsers のロールとアプリ層の canApprove() で担保"),
    ("マスタ各リスト", "編集（全メンバー）", "作成・更新・論理削除",
     "物理削除を防ぐため「アイテムの削除」を外す設定を推奨"),
    ("CtnAudit", "投稿（全メンバー）／閲覧（監査担当）", "追記のみ。更新・削除メソッドを実装しない",
     "★リスト権限でも「アイテムの編集・削除」を外す。改ざん耐性はここまで（強度が要求されるなら Dataverse 移行）"),
    ("CtnSettings", "編集（薬事担当のみ）", "閾値・オフセットの変更",
     "★全利用者の期限計算に波及するため限定。変更は必ず監査へ記録"),
    ("CtnAppUsers", "編集（システム管理者のみ）", "ロールの登録・変更",
     "ロールを自己編集できると職務分離が形骸化する"),
]
r = table(ws, ["対象", "権限レベル", "許可する操作", "備考・注意"], perm, 4,
          widths=[24, 34, 46, 96], wrap_cols=("備考・注意", "許可する操作"))

r += 3
ws.cell(row=r, column=1, value="監査証跡の3層").font = SECT_FONT
audit = [
    ("1. CtnAudit リスト", "アプリ操作の業務的記録", "誰が・いつ・何を・どう変えたか（create/update/delete/restore/submit/approve/generate-xml）",
     "リポジトリ層が全書き込みの後に追記。UI の監査ログ画面が参照する"),
    ("2. リストのバージョン管理", "アイテム単位のスナップショット", "CtnPayload を含む全列の変更前後",
     "★届の全文差分がここに残る。誤操作からの復元手段でもある。全リストで有効化する"),
    ("3. Microsoft Purview 監査ログ", "テナント全体の操作記録", "SharePoint 標準UIからの直接編集を含む",
     "★アプリを迂回した編集を検知できる唯一の層。保持期間はライセンスに依存するため要確認"),
]
r = table(ws, ["層", "位置づけ", "記録内容", "備考"], audit, r + 1,
          widths=[28, 30, 60, 82], wrap_cols=("記録内容", "備考"), freeze=False)

# ===========================================================================
# 10_要確認事項
# ===========================================================================
ws = sheet(wb, "10_要確認事項", "要確認事項（設計未確定箇所）",
           "ctn-schema.json で status=「要確認」の列。治験届の手引き・XSD と突合して確定させる。デモでは仮実装可・本番判断には使用しない。")
urows = []
for t in schema["tables"]:
    for c in t["columns"]:
        if c.get("status") == "要確認":
            urows.append((t["displayName"], t["schemaName"], c["displayName"], c["schemaName"],
                          c.get("dataType", ""), c.get("requiredByType") or "—",
                          c.get("xsdElement") or "—", c.get("notes") or c.get("inputUi") or ""))
urows.append(("（横断）", "—", "海外依頼者・外国製造業者", "CtnSponsors.CtnOverseasInfo ほか", "複数行", "○/○/○/○/○",
              "INFOFOREIGNMANUFACTURER", "邦文4項目＋外国文4項目の構造。届／薬別／届出者のどこに持たせるかを確定させる"))
urows.append(("（横断）", "—", "変更箇所→提出時期の対応", "logic.ts CHANGE_LOC_TIMING", "—", "—", "—",
              "治験使用薬の追加（変更前）・備考欄の追加（6ヶ月以内）は保守的な暫定値。手引き p.86-89 と突合して確定させる"))
urows.append(("（横断）", "—", "30日調査対応被験薬区分のコード値", "CtnNotifications Payload $.subj30dayReview", "数値", "○/○/―/―/―", "CATEGTESTPRODUCTSUBJ30DAYREVIEW",
              "refData.ts の SUBJ30_OPTIONS は暫定（1/2/3）。届出区分とは別体系であることの確認を含む"))
urows.append(("（横断）", "—", "該当有無（APPLICABLEORNOT）のコード値", "Payload $.applic* 各項", "数値", "△", "APPLICABLEORNOT",
              "refData.ts の APPLICABILITY_OPTIONS は暫定（1=該当 / 0=非該当）"))
urows.append(("（横断）", "—", "PMDA 提出用PDFの要件", "CtnGeneratedOutputs.CtnOutputKind = pdf-submission",
              "—", "—", "内部管理（PDF品質要件）",
              "★PDF出力は最終的に PMDA へ必須となる見込み。現行の届書PDFは社内レビュー用（ラスタライズ・テキスト非選択）。"
              "提出用に求められる要件（テキスト選択可・しおり付与・様式の再現度）を確定させ、"
              "サーバー側生成（Word テンプレート＋ファイル変換）へ切り替える時期を判断する"))
urows.append(("（横断）", "—", "検査キット/パッキングリストの実ファイル結合", "CtnAttachmentFiles",
              "—", "—", "—",
              "現行はデモ用サンプルPDFを生成して結合。本番で実ファイルを結合する運用に移す時期と、"
              "その前提となる CtnAttachmentFiles の構築時期を確定させる"))
last = table(ws, ["テーブル（表示名）", "テーブル", "列（表示名）", "列", "型", "必須(計/変/中/終/開)", "XSD要素", "確認すべき内容"],
             urows, 5,
             widths=[24, 20, 40, 40, 24, 20, 34, 92], wrap_cols=("確認すべき内容", "列（表示名）"))
for rr in range(6, last + 1):
    for c in range(1, 9):
        ws.cell(row=rr, column=c).fill = WARN_FILL

# ---------------------------------------------------------------------------
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
wb.save(OUT_PATH)
print("written:", OUT_PATH)
for s in wb.sheetnames:
    print("  -", s, wb[s].max_row - 1, "rows")
