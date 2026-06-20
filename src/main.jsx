import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  FileInput,
  FileText,
  History,
  LayoutDashboard,
  PackageCheck,
  Settings,
  Upload,
  Workflow,
} from "lucide-react";
import "./styles.css";

const menuGroups = [
  {
    label: "ワークスペース",
    items: [
      { id: "dashboard", title: "ダッシュボード", icon: LayoutDashboard, kicker: "Workspace", description: "期限候補、レビュー、取込確認、外字、出力エラーを横断して確認します。" },
      { id: "import", title: "既存データ取り込み", icon: FileInput, kicker: "Import", description: "PDF/XMLから抽出した候補値を、出典ページ・信頼度・マスタ照合と一緒に確認します。" },
      { id: "submission", title: "届出作成", icon: FileText, kicker: "Authoring", description: "届出内容を章ごとに入力し、右側で差分・外字・PDF出力イメージを確認します。" },
      { id: "review", title: "レビュー・承認", icon: Workflow, kicker: "Workflow", description: "入力完了から薬事確認、承認、出力準備までの状態と差戻しを管理します。" },
      { id: "output", title: "出力・提出準備", icon: PackageCheck, kicker: "Output", description: "PDF/XML、XSD検証、添付資料、ファイル命名、提出パッケージを確認します。" },
    ],
  },
  {
    label: "マスタ管理",
    items: [
      { id: "masters", title: "マスタ管理", icon: Database, kicker: "Master Data", description: "医師、医療機関、治験使用薬、届出者、CRO/SMO/IRB、添付資料を正本として管理します。" },
    ],
  },
  {
    label: "システム管理",
    items: [
      { id: "system", title: "システム管理", icon: Settings, kicker: "System Rules", description: "XSDマッピング、コード、外字、期限、通知、権限、出力設定を管理します。" },
      { id: "audit", title: "履歴・監査", icon: History, kicker: "Audit", description: "誰が、いつ、どの値を、どの根拠で確定したかを追跡します。" },
    ],
  },
];

const allItems = menuGroups.flatMap((group) => group.items);

const workQueue = [
  { task: "分担医師追加の変更届候補", trial: "CTN-03 試験薬C", source: "医師マスタ変更", baseDate: "2025-12-12", due: "2026-06-12", owner: "田中", status: "期限注意", tone: "danger" },
  { task: "PDF取込値の確認", trial: "CTN-08 試験薬H", source: "既存PDF 000270151", baseDate: "2026-06-18", due: "2026-06-25", owner: "佐藤", status: "取込確認", tone: "watch" },
  { task: "外字説明資料の承認", trial: "CTN-03 試験薬C", source: "渡邊/髙橋", baseDate: "2026-06-17", due: "2026-06-21", owner: "医学レビュー", status: "外字確認", tone: "watch" },
  { task: "XML XSDエラー修正", trial: "CTN-17 試験薬A", source: "出力検証", baseDate: "2026-06-19", due: "2026-06-19", owner: "薬事", status: "出力エラー", tone: "danger" },
];

const importCandidates = [
  { field: "主たる被験薬の治験成分記号", value: "EI-A-001", page: "p.1", confidence: "高", map: "TESTSUBSTANCEIDCODE", master: "一致", action: "採用" },
  { field: "治験責任医師の氏名", value: "責任 一郎", page: "p.5", confidence: "高", map: "principalInvestigator.name", master: "候補あり", action: "確認" },
  { field: "治験分担医師の氏名", value: "渡邊 花子", page: "p.5", confidence: "中", map: "subInvestigators.name", master: "外字候補", action: "表記確認" },
  { field: "IRB設置者の名称", value: "■■法人▲▲会□□病院 ○山×郎", page: "p.31", confidence: "低", map: "irb.ownerName", master: "未登録", action: "新規候補" },
];

const submissionChapters = [
  {
    id: "basic",
    title: "届出種別・基本情報",
    state: "入力済み",
    fields: [
      { label: "届出書種別", type: "select", value: "治験計画変更届書", options: ["治験計画届書", "治験計画変更届書", "治験終了届書", "治験中止届書", "開発中止届書"], meta: "届出種別により必要章を制御" },
      { label: "届出年月日", type: "date", value: "2026-06-19", meta: "PDF先頭とXMLに出力" },
      { label: "提出先", value: "独立行政法人医薬品医療機器総合機構理事長 殿", meta: "届出種別に応じて候補表示" },
      { label: "様式等のバージョン情報", value: "医薬品治験届 令和2年8月改正版", meta: "出力テンプレート設定から反映" },
    ],
  },
  {
    id: "common",
    title: "治験届出共通事項",
    state: "入力済み",
    fields: [
      { label: "主たる被験薬の治験成分記号", value: "EI-A-001", meta: "TESTSUBSTANCEIDCODE / マスタ一致" },
      { label: "治験の種類", type: "select", value: "1", options: ["1", "2", "3"], meta: "コード選択" },
      { label: "主たる被験薬の初回届出受付番号", value: "2020-9001", meta: "初回届から参照" },
      { label: "主たる被験薬の初回届出年月日", type: "date", value: "2020-09-01", meta: "INITNOTEDATE" },
      { label: "主たる被験薬の届出回数", type: "number", value: "11", meta: "SERIALNOTENUM" },
      { label: "当該治験計画届出受付番号", value: "2026-1120", meta: "変更届受付後に確定" },
    ],
  },
  {
    id: "primary",
    title: "主たる被験薬",
    state: "確認中",
    issues: 1,
    fields: [
      { label: "届出分類", type: "select", value: "治験計画変更届", options: ["治験計画届", "治験計画変更届", "治験終了届", "治験中止届", "開発中止届"], meta: "PDF章見出しに反映" },
      { label: "届出区分", type: "select", value: "1", options: ["1", "2", "3"], meta: "30日調査対象判定に使用" },
      { label: "30日調査対応被験薬区分", value: "新有効成分", meta: "コード・選択肢管理から候補表示" },
      { label: "製造所又は営業所の名称", value: "製薬協製薬株式会社 製剤研究所", meta: "製造所マスタ参照" },
      { label: "所在地1", value: "東京都中央区京橋2-1-1", meta: "住所表記チェック対象" },
      { label: "業者コード", value: "123456099", meta: "9桁チェック" },
      { label: "成分及び分量", type: "textarea", value: "1錠中にEI-A-001として10mg、20mg又は30mg含有する。", meta: "PDF p.1から取込 / 前回差分なし", wide: true },
      { label: "製造方法", type: "textarea", value: "化学合成したEI-A-001を日局製剤総則錠剤の項に準じて製造する。", meta: "長文欄 / PDFプレビューで折返し確認", wide: true },
    ],
  },
  {
    id: "protocol",
    title: "治験計画の概要",
    state: "入力中",
    issues: 2,
    fields: [
      { label: "実施計画書識別記号", value: "EI-A-001/00-001", meta: "PROTOCOLNUM" },
      { label: "開発の相", type: "select", value: "第I相", options: ["第I相", "第II相", "第III相", "製造販売後"], meta: "PHASECLINTRIAL" },
      { label: "試験の種類", value: "臨床薬理試験", meta: "TYPECLINTRIAL" },
      { label: "目的", type: "textarea", value: "健康成人男子志願者を対象としてEI-A-001の安全性および薬物動態について検討する。", meta: "PDF出力の長文確認", wide: true },
      { label: "予定被験者数（被験薬）", type: "number", value: "20", meta: "被験薬別人数" },
      { label: "予定被験者数（合計）", type: "number", value: "20", meta: "合計人数" },
      { label: "対象疾患", value: "健康成人男子志願者", meta: "TARGETDISEASE" },
      { label: "用法及び用量", type: "textarea", value: "EI-A-001 10mg、20mg、30mgを1日1回朝食後経口投与する。", meta: "投与経路コードと整合チェック", wide: true },
    ],
  },
  {
    id: "products",
    title: "治験使用薬等",
    state: "確認中",
    issues: 1,
    fields: [
      { label: "医薬品/医療機器/再生医療等製品の別", type: "select", value: "医薬品", options: ["医薬品", "医療機器", "再生医療等製品"], meta: "種別コード" },
      { label: "記号・名称等", value: "EI-F-001", meta: "主たる被験薬を除く治験使用薬" },
      { label: "記号・名称等の種類", type: "select", value: "治験成分記号", options: ["治験成分記号", "一般名", "販売名", "その他"], meta: "名称種別" },
      { label: "被験薬/対照薬/併用薬等の区別", type: "select", value: "被験薬", options: ["被験薬", "対照薬", "併用薬", "レスキュー薬", "その他"], meta: "区分情報" },
      { label: "国内における承認状況", type: "select", value: "未承認", options: ["未承認", "承認済", "適応外"], meta: "届出事項の条件分岐" },
      { label: "成分及び分量", type: "textarea", value: "1錠中にEI-F-001として20mg含有する。", meta: "複数行入力可能", wide: true },
    ],
  },
  {
    id: "sites",
    title: "実施医療機関",
    state: "入力中",
    issues: 3,
    fields: [
      { label: "実施医療機関の名称", value: "○○大学医学部附属病院", meta: "医療機関マスタ参照" },
      { label: "実施診療科", value: "第一内科", meta: "施設別項目" },
      { label: "所在地1", value: "○○県○○市○○町○番○号", meta: "住所1" },
      { label: "所在地2", value: "", meta: "任意" },
      { label: "電話番号", value: "012-345-6789", meta: "形式チェック" },
      { label: "実施医療機関予定被験者数", type: "number", value: "10", meta: "施設別人数" },
    ],
  },
  {
    id: "doctors",
    title: "医師情報",
    state: "要確認",
    issues: 2,
    fields: [
      { label: "治験責任医師の氏名", value: "治験 一郎", meta: "医師マスタ参照 / 変更差分あり" },
      { label: "大学番号", value: "830", meta: "大学番号一覧から候補" },
      { label: "卒業年", type: "number", value: "1962", meta: "西暦" },
      { label: "氏名よみかな", value: "ちけんいちろう", meta: "かなチェック" },
      { label: "治験分担医師の氏名", value: "髙橋 健", meta: "外字候補 / 届出用表記は高橋 健" },
      { label: "追加理由", type: "textarea", value: "前治験責任医師が院内人事により異動のため、分担医師を追加する。", meta: "変更届の理由欄候補", wide: true },
    ],
  },
  {
    id: "orgs",
    title: "CRO / SMO / IRB",
    state: "要確認",
    issues: 1,
    fields: [
      { label: "CRO氏名", value: "○○株式会社", meta: "CROマスタ参照" },
      { label: "CRO住所1", value: "東京都中央区日本橋1-1-1", meta: "住所変更差分チェック" },
      { label: "委託する業務の範囲", value: "モニタリング業務", meta: "契約書リンク確認" },
      { label: "IRB院内・外部の区分", type: "select", value: "外部IRB", options: ["院内IRB", "外部IRB"], meta: "IRB区分" },
      { label: "IRB設置者の名称", value: "■■法人▲▲会□□病院 ○山×郎", meta: "外字/記号チェック対象" },
      { label: "IRB所在地1", value: "大阪府大阪市中央区道修町6-1-1", meta: "出力対象" },
    ],
  },
  {
    id: "attachments",
    title: "添付資料・参照届出",
    state: "入力中",
    issues: 2,
    fields: [
      { label: "資料名1", value: "治験実施計画書（EI-A-001/00-001-3）", meta: "SharePoint添付資料マスタ参照" },
      { label: "資料名2", value: "インフォームド・コンセントに用いられる説明文書及び同意文書", meta: "必須資料候補" },
      { label: "外字説明資料", value: "gaiji_explanation.docx", meta: "未承認 / 出力前チェック対象" },
      { label: "参照する治験成分記号又は治験識別記号", value: "EH-A-001", meta: "参照届出情報" },
      { label: "届出回数", type: "number", value: "3", meta: "参照届出" },
      { label: "参照の詳細", type: "textarea", value: "前回変更届との差分比較対象として参照する。", meta: "必要時出力", wide: true },
    ],
  },
];

const diffs = [
  { type: "変更", item: "治験責任医師", before: "責任 一郎", after: "治験 一郎", decision: "届出対象", reason: "院内人事による変更" },
  { type: "追加", item: "分担医師", before: "-", after: "髙橋 健", decision: "期限候補", reason: "追加日から6か月以内候補" },
  { type: "表記", item: "分担医師", before: "渡邊 花子", after: "渡辺 花子", decision: "外字確認", reason: "届出用表記へ置換" },
  { type: "資料", item: "治験実施計画書", before: "v2.0", after: "v3.0", decision: "添付更新", reason: "版更新" },
];

const masterDefinitions = [
  {
    id: "doctor",
    title: "医師マスタ",
    description: "責任医師・分担医師・調整医師を同じ正本で管理し、届出ごとの役割と変更イベントに展開します。",
    fields: [
      { label: "医師ID", value: "DR-014" },
      { label: "原表記氏名", value: "髙橋 健" },
      { label: "届出用表記", value: "高橋 健" },
      { label: "氏名よみかな", value: "たかはしけん" },
      { label: "大学番号", value: "830" },
      { label: "卒業年", type: "number", value: "1998" },
      { label: "所属機関", value: "東京中央病院 循環器内科" },
      { label: "外字扱い", type: "select", value: "置換承認済み", options: ["なし", "要確認", "置換承認済み", "説明資料出力"] },
    ],
  },
  {
    id: "site",
    title: "医療機関マスタ",
    description: "施設、診療科、所在地、代表電話、責任医師、IRB/SMO紐づけを管理します。",
    fields: [
      { label: "施設ID", value: "SITE-001" },
      { label: "実施医療機関の名称", value: "○○大学医学部附属病院" },
      { label: "実施診療科", value: "第一内科" },
      { label: "所在地1", value: "○○県○○市○○町○番○号" },
      { label: "所在地2", value: "" },
      { label: "電話番号", value: "012-345-6789" },
      { label: "標準責任医師", value: "治験 一郎" },
      { label: "紐づくIRB", value: "外部IRB: ■■法人▲▲会□□病院" },
    ],
  },
  {
    id: "product",
    title: "治験使用薬マスタ",
    description: "主たる被験薬、対照薬、併用薬、レスキュー薬の記号・名称・区分・コード・数量単位を管理します。",
    fields: [
      { label: "薬剤ID", value: "DRUG-001" },
      { label: "記号・名称等", value: "EI-A-001 10mg錠" },
      { label: "名称等の種類", type: "select", value: "治験成分記号", options: ["治験成分記号", "一般名", "販売名", "その他"] },
      { label: "区分", type: "select", value: "主たる被験薬", options: ["主たる被験薬", "被験薬", "対照薬", "併用薬", "レスキュー薬"] },
      { label: "剤形コード", value: "A1" },
      { label: "投与経路コード", value: "11" },
      { label: "数量単位", value: "錠" },
      { label: "国内承認状況", type: "select", value: "未承認", options: ["未承認", "承認済", "適応外"] },
    ],
  },
  {
    id: "applicant",
    title: "届出者・依頼者マスタ",
    description: "届出者、代表者、所在地、業者コード、担当者、海外依頼者情報を管理します。",
    fields: [
      { label: "届出者の種別", type: "select", value: "治験依頼者", options: ["治験依頼者", "自ら治験を実施する者"] },
      { label: "届出者の名称", value: "製薬協製薬株式会社" },
      { label: "代表者の氏名", value: "代表取締役社長 日本 太郎" },
      { label: "所在地1", value: "東京都中央区京橋1-1-1" },
      { label: "所在地2", value: "京橋中央ビル" },
      { label: "業者コード", value: "123456000" },
      { label: "担当者の氏名", value: "薬事 亮" },
      { label: "FAX番号又はメールアドレス", value: "ra@example.co.jp" },
    ],
  },
  {
    id: "org",
    title: "CRO / SMO / IRBマスタ",
    description: "委託先、施設支援機関、IRB設置者の名称・住所・委託範囲を管理します。",
    fields: [
      { label: "組織ID", value: "ORG-022" },
      { label: "種別", type: "select", value: "CRO", options: ["CRO", "SMO", "IRB"] },
      { label: "名称", value: "○○株式会社" },
      { label: "住所1", value: "東京都中央区日本橋1-1-1" },
      { label: "住所2", value: "○○ビル" },
      { label: "委託する業務の範囲", value: "モニタリング業務" },
      { label: "IRB院内・外部区分", type: "select", value: "外部IRB", options: ["院内IRB", "外部IRB"] },
      { label: "変更時の届出要否", type: "select", value: "要判定", options: ["要判定", "届出候補", "対象外"] },
    ],
  },
  {
    id: "attachment",
    title: "添付資料マスタ",
    description: "資料名、版、届出種別ごとの必須条件、SharePoint保管先を管理します。",
    fields: [
      { label: "資料ID", value: "DOC-010" },
      { label: "資料名", value: "治験実施計画書（EI-A-001/00-001-3）" },
      { label: "版", value: "v3.0" },
      { label: "資料種別", type: "select", value: "治験実施計画書", options: ["治験実施計画書", "IB", "ICF", "CRF", "外字説明資料", "その他"] },
      { label: "必須条件", value: "治験計画届/変更届で添付候補" },
      { label: "SharePoint保管先", value: "Attachments/CTN-03/protocol_v3.pdf" },
      { label: "承認状態", type: "select", value: "承認済み", options: ["下書き", "レビュー中", "承認済み", "差戻し"] },
      { label: "出力対象", type: "select", value: "対象", options: ["対象", "対象外"] },
    ],
  },
];

const masterRecords = {
  doctor: [
    { id: "DR-014", name: "髙橋 健", sub: "東京中央病院 循環器内科", status: "外字承認済み", updated: "2026-06-18", values: { "医師ID": "DR-014", "原表記氏名": "髙橋 健", "届出用表記": "高橋 健", "氏名よみかな": "たかはしけん", "大学番号": "830", "卒業年": "1998", "所属機関": "東京中央病院 循環器内科", "外字扱い": "置換承認済み" } },
    { id: "DR-022", name: "渡邊 花子", sub: "大阪北医療センター 消化器内科", status: "説明資料候補", updated: "2026-06-17", values: { "医師ID": "DR-022", "原表記氏名": "渡邊 花子", "届出用表記": "渡辺 花子", "氏名よみかな": "わたなべはなこ", "大学番号": "732", "卒業年": "2004", "所属機関": "大阪北医療センター 消化器内科", "外字扱い": "説明資料出力" } },
    { id: "DR-031", name: "治験 一郎", sub: "○○大学医学部附属病院 第一内科", status: "通常表記", updated: "2026-06-12", values: { "医師ID": "DR-031", "原表記氏名": "治験 一郎", "届出用表記": "治験 一郎", "氏名よみかな": "ちけんいちろう", "大学番号": "830", "卒業年": "1962", "所属機関": "○○大学医学部附属病院 第一内科", "外字扱い": "なし" } },
  ],
  site: [
    { id: "SITE-001", name: "○○大学医学部附属病院", sub: "第一内科", status: "実施中", updated: "2026-06-10", values: { "施設ID": "SITE-001", "実施医療機関の名称": "○○大学医学部附属病院", "実施診療科": "第一内科", "所在地1": "○○県○○市○○町○番○号", "所在地2": "", "電話番号": "012-345-6789", "標準責任医師": "治験 一郎", "紐づくIRB": "外部IRB: ■■法人▲▲会□□病院" } },
    { id: "SITE-002", name: "東京中央病院", sub: "循環器内科", status: "責任医師変更候補", updated: "2026-06-08", values: { "施設ID": "SITE-002", "実施医療機関の名称": "東京中央病院", "実施診療科": "循環器内科", "所在地1": "東京都千代田区1-1-1", "所在地2": "中央メディカル棟", "電話番号": "03-1234-5678", "標準責任医師": "山田 太郎", "紐づくIRB": "院内IRB: 東京中央病院治験審査委員会" } },
    { id: "SITE-003", name: "大阪北医療センター", sub: "消化器内科", status: "外字確認あり", updated: "2026-06-05", values: { "施設ID": "SITE-003", "実施医療機関の名称": "大阪北医療センター", "実施診療科": "消化器内科", "所在地1": "大阪府大阪市北区2-2-2", "所在地2": "", "電話番号": "06-9876-5432", "標準責任医師": "渡辺 花子", "紐づくIRB": "外部IRB: 大阪北IRB" } },
  ],
  product: [
    { id: "DRUG-001", name: "EI-A-001 10mg錠", sub: "主たる被験薬", status: "未承認", updated: "2026-06-16", values: { "薬剤ID": "DRUG-001", "記号・名称等": "EI-A-001 10mg錠", "名称等の種類": "治験成分記号", "区分": "主たる被験薬", "剤形コード": "A1", "投与経路コード": "11", "数量単位": "錠", "国内承認状況": "未承認" } },
    { id: "DRUG-002", name: "EI-F-001 20mg錠", sub: "被験薬", status: "数量確認", updated: "2026-06-14", values: { "薬剤ID": "DRUG-002", "記号・名称等": "EI-F-001 20mg錠", "名称等の種類": "治験成分記号", "区分": "被験薬", "剤形コード": "A1", "投与経路コード": "11", "数量単位": "錠", "国内承認状況": "未承認" } },
    { id: "DRUG-003", name: "プラセボ錠", sub: "対照薬", status: "承認済み", updated: "2026-05-29", values: { "薬剤ID": "DRUG-003", "記号・名称等": "プラセボ錠", "名称等の種類": "その他", "区分": "対照薬", "剤形コード": "A1", "投与経路コード": "11", "数量単位": "錠", "国内承認状況": "適応外" } },
  ],
  applicant: [
    { id: "APP-001", name: "製薬協製薬株式会社", sub: "治験依頼者", status: "有効", updated: "2026-06-01", values: { "届出者の種別": "治験依頼者", "届出者の名称": "製薬協製薬株式会社", "代表者の氏名": "代表取締役社長 日本 太郎", "所在地1": "東京都中央区京橋1-1-1", "所在地2": "京橋中央ビル", "業者コード": "123456000", "担当者の氏名": "薬事 亮", "FAX番号又はメールアドレス": "ra@example.co.jp" } },
    { id: "APP-002", name: "Global Sponsor Inc.", sub: "海外依頼者", status: "住所確認", updated: "2026-05-20", values: { "届出者の種別": "治験依頼者", "届出者の名称": "Global Sponsor Inc.", "代表者の氏名": "John Smith", "所在地1": "1-1 Nihonbashi, Chuo-ku, Tokyo", "所在地2": "", "業者コード": "987654000", "担当者の氏名": "薬事 亮", "FAX番号又はメールアドレス": "global-ra@example.com" } },
  ],
  org: [
    { id: "ORG-022", name: "○○株式会社", sub: "CRO / モニタリング業務", status: "契約中", updated: "2026-06-11", values: { "組織ID": "ORG-022", "種別": "CRO", "名称": "○○株式会社", "住所1": "東京都中央区日本橋1-1-1", "住所2": "○○ビル", "委託する業務の範囲": "モニタリング業務", "IRB院内・外部区分": "外部IRB", "変更時の届出要否": "要判定" } },
    { id: "ORG-030", name: "CTN Site Support", sub: "SMO / 治験支援業務", status: "住所変更候補", updated: "2026-06-09", values: { "組織ID": "ORG-030", "種別": "SMO", "名称": "CTN Site Support", "住所1": "東京都港区3-3-3", "住所2": "Site Support Tower", "委託する業務の範囲": "治験支援業務", "IRB院内・外部区分": "外部IRB", "変更時の届出要否": "届出候補" } },
    { id: "ORG-041", name: "■■法人▲▲会□□病院", sub: "IRB / 外部IRB", status: "外字確認", updated: "2026-06-06", values: { "組織ID": "ORG-041", "種別": "IRB", "名称": "■■法人▲▲会□□病院", "住所1": "大阪府大阪市中央区道修町6-1-1", "住所2": "○□ビル", "委託する業務の範囲": "治験審査", "IRB院内・外部区分": "外部IRB", "変更時の届出要否": "要判定" } },
  ],
  attachment: [
    { id: "DOC-010", name: "治験実施計画書", sub: "v3.0 / PDF", status: "承認済み", updated: "2026-06-15", values: { "資料ID": "DOC-010", "資料名": "治験実施計画書（EI-A-001/00-001-3）", "版": "v3.0", "資料種別": "治験実施計画書", "必須条件": "治験計画届/変更届で添付候補", "SharePoint保管先": "Attachments/CTN-03/protocol_v3.pdf", "承認状態": "承認済み", "出力対象": "対象" } },
    { id: "DOC-018", name: "外字説明資料", sub: "v1.0 / docx", status: "レビュー中", updated: "2026-06-18", values: { "資料ID": "DOC-018", "資料名": "外字説明資料", "版": "v1.0", "資料種別": "外字説明資料", "必須条件": "外字置換がある場合に添付候補", "SharePoint保管先": "Attachments/CTN-03/gaiji_explanation.docx", "承認状態": "レビュー中", "出力対象": "対象" } },
  ],
};

function App() {
  const [activeId, setActiveId] = useState("dashboard");
  const active = useMemo(() => allItems.find((item) => item.id === activeId) ?? allItems[0], [activeId]);

  return (
    <div className="ctn-shell">
      <aside className="side-nav">
        <div className="brand">
          <span>CTN</span>
          <div>
            <strong>治験届管理</strong>
            <small>作成・確認・提出準備</small>
          </div>
        </div>
        <nav>
          {menuGroups.map((group) => (
            <section key={group.label} className="nav-group">
              <p>{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={activeId === item.id ? "active" : ""} onClick={() => setActiveId(item.id)}>
                    <Icon size={16} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </section>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <small>{active.kicker}</small>
            <h1>{active.title}</h1>
            <p>{active.description}</p>
          </div>
          <div className="toolbar">
            <button className="ghost-button"><Bell size={16} />通知</button>
            <button className="primary-button"><CheckCircle2 size={16} />レビュー用に保存</button>
          </div>
        </header>
        {renderPage(activeId, setActiveId)}
      </main>
    </div>
  );
}

function renderPage(activeId, setActiveId) {
  if (activeId === "dashboard") return <Dashboard setActiveId={setActiveId} />;
  if (activeId === "import") return <ImportPage setActiveId={setActiveId} />;
  if (activeId === "submission") return <SubmissionPage />;
  if (activeId === "review") return <ReviewPage />;
  if (activeId === "output") return <OutputPage />;
  if (activeId === "masters") return <MasterPage />;
  if (activeId === "system") return <SystemPage />;
  return <AuditPage />;
}

function Dashboard({ setActiveId }) {
  return (
    <div className="page-grid">
      <div className="metric-strip">
        <Metric label="期限注意" value="5" tone="danger" note="マスタ変更から算出" />
        <Metric label="レビュー待ち" value="8" tone="watch" note="一次/薬事/QA" />
        <Metric label="取込未確認" value="3" note="PDF抽出候補" />
        <Metric label="外字確認" value="2" tone="watch" note="説明資料候補" />
        <Metric label="出力エラー" value="1" tone="danger" note="XSD検証" />
      </div>

      <section className="panel">
        <Title tag="Priority Queue" title="今対応すべき届出・確認事項" text="期限候補、レビュー、取込、外字、出力検証を同じキューに集約します。" />
        <DataTable
          headers={["タスク", "対象試験", "発生元", "起算日", "期限候補", "担当", "状態"]}
          rows={workQueue.map((row) => [row.task, row.trial, row.source, row.baseDate, row.due, row.owner, <span className={`pill ${row.tone}`}>{row.status}</span>])}
        />
      </section>

      <div className="two-col">
        <section className="panel">
          <Title tag="Data Flow" title="データの流れ" text="取り込み値、マスタ値、手入力値を届出ドラフトに集約し、確定値だけを出力へ渡します。" />
          <Flow steps={["PDF/XML/手入力", "抽出候補", "マスタ照合", "届出ドラフト", "差分/外字/期限", "承認", "PDF/XML出力"]} />
        </section>
        <section className="panel">
          <Title tag="Rules" title="期限とリマインド" text="期限は確定提出日ではなく、変更イベントから算出する届出期限候補として扱います。" />
          <RuleList />
          <button className="ghost-button wide-button" onClick={() => setActiveId("system")}><Settings size={16} />通知ルールを確認</button>
        </section>
      </div>
    </div>
  );
}

function ImportPage({ setActiveId }) {
  return (
    <div className="page-grid">
      <section className="panel import-layout">
        <div>
          <Title tag="Import Review" title="既存PDF取り込み" text="ここで扱うPDFは最終出力ではなく、抽出値の出典確認用の原本です。候補値、出典ページ、信頼度、マッピング、マスタ照合を確認します。" />
          <div className="upload-box">
            <Upload size={22} />
            <strong>000270151.pdf</strong>
            <span>33ページ / テキスト抽出済み / OCR補完 4項目</span>
          </div>
          <DataTable
            headers={["抽出項目", "抽出値", "出典", "信頼度", "マッピング先", "マスタ照合", "処理"]}
            rows={importCandidates.map((row) => [row.field, row.value, row.page, row.confidence, row.map, row.master, row.action])}
          />
        </div>
        <SourceDocumentViewer />
      </section>

      <section className="panel">
        <Title tag="Pipeline" title="ドラフト反映までの確認ステップ" text="抽出候補は正本ではなく、レビュー済みの確定値だけが届出ドラフトへ入ります。" />
        <Flow steps={["原本保存", "OCR/抽出", "項目マッピング", "マスタ照合", "人手確認", "ドラフト反映"]} />
        <button className="primary-button" onClick={() => setActiveId("submission")}><FileText size={16} />届出ドラフトへ反映</button>
      </section>
    </div>
  );
}

function SubmissionPage() {
  const [chapterId, setChapterId] = useState("basic");
  const [inspectorTab, setInspectorTab] = useState("check");
  const chapterIndex = submissionChapters.findIndex((chapter) => chapter.id === chapterId);
  const chapter = submissionChapters[chapterIndex] ?? submissionChapters[0];

  return (
    <section className="authoring">
      <aside className="chapter-list">
        <h2>届出作成</h2>
        {submissionChapters.map((section) => (
          <button key={section.id} className={`${section.issues ? "has-issue" : ""} ${section.id === chapter.id ? "selected" : ""}`} onClick={() => setChapterId(section.id)}>
            <span>{section.title}</span>
            <small>{section.state}{section.issues ? ` / ${section.issues}件` : ""}</small>
          </button>
        ))}
      </aside>
      <main className="editor-panel">
        <Title tag="Submission Fields" title={chapter.title} text="届出作成中はPDFを見る画面ではなく、入力値、必須チェック、マスタ参照、差分、外字を確認する作業画面として扱います。" />
        <div className="field-grid">
          {chapter.fields.map((field) => <InputField key={field.label} field={field} />)}
        </div>
        <div className="form-actions">
          <button className="ghost-button" disabled={chapterIndex === 0} onClick={() => setChapterId(submissionChapters[chapterIndex - 1].id)}>前の章</button>
          <button className="primary-button" onClick={() => setChapterId(submissionChapters[Math.min(chapterIndex + 1, submissionChapters.length - 1)].id)}>次の章へ</button>
        </div>
      </main>
      <aside className="inspector">
        <div className="tabs">
          {[
            ["check", "チェック"],
            ["diff", "差分"],
            ["gaiji", "外字"],
            ["master", "マスタ参照"],
          ].map(([id, label]) => (
            <button key={id} className={inspectorTab === id ? "active" : ""} onClick={() => setInspectorTab(id)}>{label}</button>
          ))}
        </div>
        {inspectorTab === "check" && <CheckPanel chapter={chapter} />}
        {inspectorTab === "diff" && <DiffPanel compact />}
        {inspectorTab === "gaiji" && <GaijiPanel />}
        {inspectorTab === "master" && <MasterReferencePanel chapter={chapter} />}
      </aside>
    </section>
  );
}

function ReviewPage() {
  return (
    <div className="page-grid">
      <section className="panel">
        <Title tag="Workflow" title="レビュー・承認ワークフロー" text="届出種別ごとに承認ルートを設定し、差戻し理由、コメント、電子承認ログを保存します。" />
        <div className="workflow-bar">
          {["下書き", "入力完了", "一次レビュー", "薬事確認", "承認待ち", "出力準備"].map((step, index) => (
            <article key={step} className={index < 3 ? "done" : index === 3 ? "current" : ""}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
              <small>{index === 3 ? "未完了チェック 4件" : index < 3 ? "完了" : "待機中"}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <Title tag="Review Queue" title="レビュー対象" text="差分、外字、添付不足、XSDエラーをレビュー観点として提示します。" />
        <DiffPanel />
      </section>
      <section className="panel review-artifact">
        <div>
          <Title tag="Approved Artifact" title="承認後に確認する固定版PDF" text="入力途中の画面ではPDFを常設せず、ワークフローで承認された版、または承認直前に固定したレビュー版だけをPDFとして確認します。" />
          <div className="check-grid">
            <CheckCard title="承認版PDF" status="承認待ち" detail="薬事確認後に固定版を生成" tone="watch" />
            <CheckCard title="固定版XML" status="未生成" detail="承認後にXMLとXSD検証を実行" />
          </div>
        </div>
        <PdfPreview title="承認後PDFビュー" compact />
      </section>
    </div>
  );
}

function OutputPage() {
  return (
    <section className="panel output-layout">
      <div>
        <Title tag="Output Package" title="PDF/XML提出準備" text="承認済みの届出ドラフトから、PDF、XML、添付資料、ファイル命名、XSD検証を一括確認します。" />
        <div className="check-grid">
          <CheckCard title="PDF生成" status="完了" detail="出力イメージと章構成を確認済み" />
          <CheckCard title="XML生成" status="警告あり" detail="投与経路コード 1件確認待ち" tone="watch" />
          <CheckCard title="XSD検証" status="エラー 1件" detail="必須項目未入力" tone="danger" />
          <CheckCard title="添付資料" status="不足 1件" detail="外字説明資料が未承認" tone="watch" />
        </div>
        <DataTable
          headers={["出力物", "ファイル名", "状態", "確認者"]}
          rows={[
            ["届出PDF", "CTN-03_change_011.pdf", "生成済み", "薬事"],
            ["届出XML", "CTN-03_change_011.xml", "検証中", "システム"],
            ["添付資料ZIP", "CTN-03_attachments.zip", "不足あり", "田中"],
          ]}
        />
      </div>
      <PdfPreview title="PDF最終確認" />
    </section>
  );
}

function MasterPage() {
  const [masterId, setMasterId] = useState("doctor");
  const [selectedRecordIds, setSelectedRecordIds] = useState({});
  const activeMaster = masterDefinitions.find((item) => item.id === masterId) ?? masterDefinitions[0];
  const records = masterRecords[activeMaster.id] ?? [];
  const selectedRecordId = selectedRecordIds[activeMaster.id] ?? records[0]?.id;
  const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? records[0];
  const fields = activeMaster.fields.map((field) => ({
    ...field,
    value: selectedRecord?.values?.[field.label] ?? field.value,
  }));

  function selectMaster(id) {
    setMasterId(id);
  }

  function selectRecord(id) {
    setSelectedRecordIds((current) => ({ ...current, [activeMaster.id]: id }));
  }

  return (
    <section className="master-layout">
      <aside className="master-menu">
        <h2>マスタ種別</h2>
        {masterDefinitions.map((item) => (
          <button key={item.id} className={item.id === activeMaster.id ? "selected" : ""} onClick={() => selectMaster(item.id)}>
            <span>{item.title}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </aside>
      <main className="master-workspace">
        <section className="panel">
          <Title tag="Master Records" title={`${activeMaster.title} 一覧`} text="登録済みの正本データを一覧で確認し、編集対象を選択します。変更イベントはこの一覧の更新から発生します。" />
          <DataTable
            headers={["ID", "名称", "補足", "状態", "最終更新", "操作"]}
            rows={records.map((record) => [
              record.id,
              record.name,
              record.sub,
              record.status,
              record.updated,
              <button className="link-button" onClick={() => selectRecord(record.id)}>{record.id === selectedRecord?.id ? "編集中" : "編集"}</button>,
            ])}
          />
        </section>
        <section className="panel">
          <Title tag="Master Form" title={`${selectedRecord?.name ?? activeMaster.title} の入力内容`} text="一覧で選択したレコードの入力フィールドです。ここで更新した内容が、届出作成時の参照値や変更届候補の発生元になります。" />
          <div className="field-grid">
            {fields.map((field) => <InputField key={`${selectedRecord?.id}-${field.label}`} field={field} />)}
          </div>
          <div className="form-actions">
            <button className="ghost-button">変更履歴を見る</button>
            <button className="primary-button">マスタを保存</button>
          </div>
        </section>
        <section className="sub-panel">
          <h3>変更イベント化の例</h3>
          <DataTable
            headers={["変更内容", "起算日", "届出候補", "確認状態"]}
            rows={[
              ["氏名/住所/区分などの変更", "変更発生日", "変更届候補を生成", "薬事確認待ち"],
              ["新規追加", "登録日または契約日", "届出要否を判定", "担当者確認済み"],
            ]}
          />
        </section>
      </main>
    </section>
  );
}

function SystemPage() {
  return (
    <div className="page-grid">
      <section className="panel">
        <Title tag="System Rules" title="設定可能にするルール" text="業務ルールはコード固定にせず、管理者が保守できる設定として切り出します。" />
        <div className="settings-grid">
          <CheckCard title="XSD項目・出力マッピング" status="管理者設定" detail="画面項目とXML要素、PDF表示位置を対応" />
          <CheckCard title="コード・選択肢" status="管理者設定" detail="剤形、投与経路、薬効分類、届出区分" />
          <CheckCard title="外字・表記ゆれ" status="承認履歴" detail="原表記、届出用表記、説明資料要否" />
          <CheckCard title="通知・期限ルール" status="ユーザー設定可" detail="90/60/30/14/7日前、超過時の通知" />
          <CheckCard title="権限・ロール" status="Entra ID連携" detail="担当者、レビュー、承認者、管理者" />
          <CheckCard title="出力テンプレート" status="版管理" detail="PDF/XML、命名規則、提出パッケージ" />
        </div>
      </section>
      <section className="panel">
        <Title tag="Reminder" title="リマインド設定例" text="標準ルールに加えて、ユーザー単位で通知タイミングと通知チャネルを調整できます。" />
        <RuleList />
      </section>
    </div>
  );
}

function AuditPage() {
  return (
    <section className="panel">
      <Title tag="Audit Trail" title="履歴・監査" text="取り込み、マスタ照合、置換、レビュー、承認、出力のすべてを監査ログとして残します。" />
      <DataTable
        headers={["日時", "操作", "対象", "実施者", "根拠"]}
        rows={[
          ["2026-06-19 09:10", "PDF抽出候補を採用", "主たる被験薬の治験成分記号", "田中", "000270151.pdf p.1"],
          ["2026-06-19 10:22", "外字置換を承認", "髙橋 健 -> 高橋 健", "医学レビュー", "外字ルール G-004"],
          ["2026-06-19 14:05", "差戻し", "XSD必須項目", "QA", "投与経路コード未入力"],
        ]}
      />
    </section>
  );
}

function InputField({ field }) {
  return (
    <label className={`field ${field.wide ? "wide" : ""}`}>
      <span>{field.label}</span>
      {field.type === "select" ? (
        <select defaultValue={field.value}>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea defaultValue={field.value} />
      ) : (
        <input type={field.type || "text"} defaultValue={field.value} />
      )}
      <small>{field.meta || "マスタ入力フィールド"}</small>
    </label>
  );
}

function Title({ tag, title, text }) {
  return (
    <div className="section-title">
      <div>
        <span className="tag">{tag}</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, note, tone }) {
  return (
    <article className={`metric ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Flow({ steps }) {
  return (
    <div className="flow">
      {steps.map((step, index) => (
        <article key={step}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </article>
      ))}
    </div>
  );
}

function RuleList() {
  return (
    <div className="rule-list">
      <article><strong>分担医師 追加/削除/氏名変更</strong><span>起算日: 変更日 / 期限候補: 1年以内 / 通知: 90, 30, 7日前</span></article>
      <article><strong>CRO/SMO/IRB 変更</strong><span>起算日: 契約・変更発生日 / 期限候補: 6か月以内 / 通知: 60, 30, 14日前</span></article>
      <article><strong>出力前チェック</strong><span>PDF/XML生成時 / XSDエラー、添付不足、外字未承認を即時通知</span></article>
    </div>
  );
}

function CheckPanel({ chapter }) {
  return (
    <div className="mini-panel">
      <h3>チェック結果</h3>
      <ul>
        <li><CheckCircle2 size={14} /> {chapter.title}の入力フィールドを表示中</li>
        <li><AlertTriangle size={14} /> 条件付き必須項目は届出種別に応じて判定</li>
        <li><AlertTriangle size={14} /> 添付資料・外字・XSDは出力前に再チェック</li>
      </ul>
    </div>
  );
}

function GaijiPanel() {
  return (
    <div className="mini-panel">
      <h3>外字チェック</h3>
      <DataTable
        headers={["原表記", "届出用表記", "扱い"]}
        rows={[
          ["髙橋 健", "高橋 健", "置換承認済み"],
          ["渡邊 花子", "渡辺 花子", "説明資料候補"],
          ["○山×郎", "要確認", "IRB設置者名"],
        ]}
      />
    </div>
  );
}

function MasterReferencePanel({ chapter }) {
  const hints = {
    doctors: [["医師マスタ", "治験 一郎", "責任医師として参照"], ["医師マスタ", "髙橋 健", "外字置換あり"]],
    sites: [["医療機関マスタ", "○○大学医学部附属病院", "施設情報を参照"], ["IRBマスタ", "■■法人▲▲会□□病院", "外部IRB"]],
    products: [["治験使用薬マスタ", "EI-A-001 10mg錠", "主たる被験薬"], ["コード管理", "投与経路コード 11", "経口"]],
    orgs: [["CRO/SMO/IRBマスタ", "○○株式会社", "CRO"], ["CRO/SMO/IRBマスタ", "CTN Site Support", "SMO"]],
  };
  const rows = hints[chapter.id] ?? [["届出者マスタ", "製薬協製薬株式会社", "届出者情報"], ["添付資料マスタ", "治験実施計画書 v3.0", "出力前に承認確認"]];
  return (
    <div className="mini-panel">
      <h3>マスタ参照</h3>
      <DataTable headers={["参照元", "候補値", "扱い"]} rows={rows} />
    </div>
  );
}

function DiffPanel({ compact }) {
  return (
    <div className={compact ? "mini-panel" : ""}>
      {compact && <h3>差分サマリ</h3>}
      <DataTable
        headers={compact ? ["種別", "項目", "判定"] : ["種別", "項目", "前回", "今回", "判定", "理由"]}
        rows={diffs.map((row) => compact ? [row.type, row.item, row.decision] : [row.type, row.item, row.before, row.after, row.decision, row.reason])}
      />
    </div>
  );
}

function SourceDocumentViewer() {
  return (
    <div className="source-viewer">
      <div className="pdf-head">
        <FileText size={16} />
        <strong>原本・出典確認</strong>
      </div>
      <div className="source-page">
        <p className="source-title">000270151.pdf p.5</p>
        <p>治験責任医師の氏名: 責任 一郎</p>
        <p className="source-mark">治験分担医師の氏名: 渡邊 花子</p>
        <p>実施医療機関: ○○大学医学部附属病院 第一内科</p>
        <p className="source-note">抽出候補の根拠ページを確認するためのビューです。最終PDFプレビューではありません。</p>
      </div>
    </div>
  );
}

function PdfPreview({ title, compact, chapter }) {
  const lines = chapter?.fields?.slice(0, 5).map((field) => [field.label, field.value]) ?? [
    ["届出年月日", "20260619"],
    ["主たる被験薬の治験成分記号", "EI-A-001"],
    ["治験責任医師", "治験 一郎"],
    ["分担医師", "高橋 健（外字置換）"],
  ];
  return (
    <div className={`pdf-preview ${compact ? "compact" : ""}`}>
      <div className="pdf-head">
        <FileText size={16} />
        <strong>{title}</strong>
      </div>
      <div className="pdf-page">
        <p className="pdf-title">治験計画変更届書</p>
        {lines.map(([label, value], index) => (
          <p key={label} className={index === 1 ? "mark" : index === 4 ? "mark warn" : ""}>{label} {String(value || "（未入力）").replaceAll("-", "")}</p>
        ))}
      </div>
    </div>
  );
}

function CheckCard({ title, status, detail, tone }) {
  return (
    <article className={`check-card ${tone || ""}`}>
      <span>{status}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </article>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
