// ============================================================================
// 参照データ・定数・小ヘルパ
// ============================================================================
import { choiceSet, choiceLabel } from "./schema";
import { ROLE_LABEL, type CtnRole } from "./permissions";
import type { CodeKind, Lang, NotifTypeKey, StatusKey } from "./types";
export { NOTIF_TYPE_ORDER } from "./types";
export type { CtnRole } from "./permissions";

// デモの基準日（本番相当。実クロックに依存せず再現可能にする）
export const TODAY = "2026-07-14";

// ---- 選択肢セット名（schema の setName と一致させる） ----
export const SET = {
  notifType: "届出種別",
  targetCategory: "対象区分",
  kubun: "届出区分",
  status: "ステータス",
  drugRole: "主従区分",
  doctorRole: "医師区分",
  phase: "開発の相",
  trialType: "試験の種類",
  changeLocations: "変更箇所（複数選択）",
  devStatus: "開発状態",
  changeType: "異動区分",
  combCategory: "薬剤区別",
  docType: "資料種別",
  attachStatus: "添付ステータス",
  irbType: "IRB区分",
  gaijiType: "外字判定区分",
} as const;

export const label = (setName: string, value: number | undefined) =>
  choiceLabel(setName, value);
export const options = (setName: string) => choiceSet(setName);

// ---- 届出種別 <-> choice値 / キー ----
export const NOTIF_TYPE_VALUE: Record<NotifTypeKey, number> = {
  plan: 100000000,
  change: 100000001,
  termination: 100000002,
  completion: 100000003,
  devDiscontinuation: 100000004,
};
export const NOTIF_TYPE_LABEL: Record<NotifTypeKey, [string, string]> = {
  plan: ["Clinical Trial Plan", "治験計画届"],
  change: ["Plan Change", "治験計画変更届"],
  termination: ["Discontinuation", "治験中止届"],
  completion: ["Completion", "治験終了届"],
  devDiscontinuation: ["Dev. Discontinuation", "開発中止届"],
};
export const NOTIF_TYPE_SHORT: Record<NotifTypeKey, string> = {
  plan: "計画",
  change: "変更",
  termination: "中止",
  completion: "終了",
  devDiscontinuation: "開発中止",
};
export const notifTypeName = (k: NotifTypeKey, lang: Lang) =>
  lang === "ja" ? NOTIF_TYPE_LABEL[k][1] : NOTIF_TYPE_LABEL[k][0];

// ---- ステータス <-> choice値 / 表示 ----
// choice値は SharePoint 側の既存データと整合させるため据え置く（承認済=…302 は欠番）
export const STATUS_VALUE: Record<StatusKey, number> = {
  draft: 100000300,
  review: 100000301,
  submitted: 100000303,
};
export const STATUS_ORDER: StatusKey[] = ["draft", "review", "submitted"];
export const STATUS_LABEL: Record<StatusKey, [string, string]> = {
  draft: ["Draft", "作成中"],
  review: ["In Review", "レビュー中"],
  submitted: ["Submitted", "提出済み"],
};
// UIステータス色クラス（index.css の g/a/r と別に専用）
export const STATUS_CLASS: Record<StatusKey, string> = {
  draft: "st-draft",
  review: "st-review",
  submitted: "st-submitted",
};
export const statusName = (k: StatusKey, lang: Lang) =>
  lang === "ja" ? STATUS_LABEL[k][1] : STATUS_LABEL[k][0];

// ---- 固定 choice値（分岐で使うもの） ----
export const DRUG_ROLE = { main: 100000400, other: 100000401 } as const;
export const DOCTOR_ROLE = { responsible: 100000500, sub: 100000501 } as const;
export const CHANGE_TYPE = {
  register: 100001000, // 登録（初回）
  add: 100001001, // 追加
  remove: 100001002, // 削除
  change: 100001003, // 変更
} as const;
export const IRB_TYPE = { internal: 100001400, external: 100001401 } as const;
export const DEV_STATUS = { active: 100000900, discontinued: 100000901 } as const;
export const KUBUN = { k1: 100000200, k2: 100000201, k3: 100000202 } as const;
// 治験使用薬等の別（手引き 5.3(1)：医薬品／医療機器／体外診断用医薬品／再生医療等製品）。
// 参照する治験届出情報（手引き 5.5）は医薬品／医療機器／再生医療等製品の3区分。
export const TARGET_CATEGORY = { drug: 100000100, device: 100000101, regen: 100000102, ivd: 100000103 } as const;
export const GAIJI_TYPE = {
  outOfJis: 100001500,
  platformDependent: 100001501,
  ivs: 100001502,
  pua: 100001503,
} as const;
export const ATTACH_STATUS = { attached: 100001300, checking: 100001301, optional: 100001302 } as const;
// 資料種別のうち分岐で使うもの（検査キット/パッキングリストは提出パッケージで実PDFを同梱）
export const DOC_TYPE = { packingList: 100001208 } as const;
// 薬剤区別（被験薬/対照薬/併用薬/レスキュー薬/その他）
export const COMB = { subject: 100001100, control: 100001101, concomitant: 100001102, rescue: 100001103, other: 100001104 } as const;
export const COMB_PLACEHOLDER = COMB.control; // プラセボ＝対照薬

// ============================================================================
// 該当の有無 / 該当の有無等（手引き 5.2(13)(14)）
// ----------------------------------------------------------------------------
// 手引きは項目ごとに「入力する文字列」を指定している。単なる有無ではないものが
// 3つあり（カルタヘナ法・生物由来製品・臨床試験の位置付け）、それらは項目名も
// 「該当の有無等」になっている。以前はすべて 該当/非該当 の2択にしていたため、
// 手引きの区分を入力できず、届書にも出せなかった。
//
// 届書には選んだ文字列がそのまま印字される（参照出力 AMG 410 も「該当あり」
// 「該当なし」「新有効成分」といった文字列）。value はアプリ内部の保存値。
// ============================================================================

/** 該当の有無（コンパニオン診断薬・コンビネーション製品・国際共同治験・ゲノム検査・マイクロドーズ・併用機械器具） */
export const APPLICABILITY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "該当あり" },
  { value: 0, label: "該当なし" },
];

/**
 * カルタヘナ法の対象となる薬物を用いる治験（手引き 5.2(13)1））。
 * 「第一種」「第二種」「第一種及び第二種」のいずれか、または「該当なし」。
 * 該当する場合は「該当する場合の詳述」に承認取得状況・拡散防止措置確認の有無
 * ・作業レベルを入力する（同項）。
 */
export const CARTAGENA_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "第一種" },
  { value: 2, label: "第二種" },
  { value: 3, label: "第一種及び第二種" },
  { value: 0, label: "該当なし" },
];

/**
 * 生物由来製品に指定が見込まれる薬物を用いる治験（手引き 5.2(13)2））。
 * 詳述の欄が別に無いのは、この4区分が詳述を兼ねているため。
 */
export const BIOLOGICAL_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "生物由来製品（見込み）" },
  { value: 2, label: "生物由来製品（指定済み）" },
  { value: 3, label: "特定生物由来製品（見込み）" },
  { value: 4, label: "特定生物由来製品（指定済み）" },
  { value: 0, label: "該当なし" },
];

/**
 * 臨床試験の位置付け（手引き 5.2(14)1））。
 * 「拡大治験」を選ぶ場合は「その他」に「拡大治験、主たる治験の受付番号○○-○○○○」
 * と入力する（同(14)6））。
 */
export const TRIAL_POSITION_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "主たる治験" },
  { value: 2, label: "拡大治験" },
  { value: 0, label: "該当なし" },
];

/**
 * 主たる被験薬の30日調査対応被験薬区分（手引き 5.2(5)）。
 * 30日調査の対象となる場合に「新有効成分」「新投与経路」「新医療用配合剤」の
 * いずれかを入力する。対象外・マイクロドーズ臨床試験の場合は空欄
 * （既に人に投与済みで初回届の場合は空欄とし、備考にその旨を入力する）。
 *
 * 以前は「1（30日調査対応被験薬）」等の独自の3区分にしていた。参照出力
 * （AMG 410）は「新有効成分」と印字されており、独自区分は届書に出せない。
 */
export const SUBJ30_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "新有効成分" },
  { value: 2, label: "新投与経路" },
  { value: 3, label: "新医療用配合剤" },
];

/** 記号・名称等の種類（手引き 5.3(2)）。「その他」は詳述を入力する */
export const ID_TYPE_OPTIONS = ["治験成分記号", "治験識別記号", "一般的名称", "その他"] as const;

/** 国内における承認状況（手引き 5.3(4)） */
export const APPROVAL_STATUS_OPTIONS = ["未承認", "適応外", "既承認"] as const;

/** 副作用報告の有無（手引き 5.3(5)：「有」を入力すること） */
export const ADR_REPORT_OPTIONS = ["有", "無"] as const;
export const ADR_REPORT_DEFAULT = "有";

/** 参照の区分（手引き 5.5：「1」又は「2」を半角数字で入力） */
export const REF_TYPE_OPTIONS = ["1", "2"] as const;

/**
 * 開発の相 → 手引きの開発相コード（半角数字1桁・手引き 5.2(12)2））。
 * 届書には数字が印字される（参照出力 AMG 410 の「開発の相」は "1"）。
 * 早期探索的臨床試験＝0 / 第I相＝1 / 第II相＝2 / 第III相＝3 /
 * 第I/II相＝4 / 第II/III相＝5 / 第I/III相＝6
 */
export const OFFICIAL_PHASE: Record<number, string> = {
  100000605: "0",
  100000600: "1",
  100000602: "2",
  100000604: "3",
  100000601: "4",
  100000603: "5",
  100000606: "6",
};

/** 業者コードの桁数（手引き 5.2(7)・5.2(17)：9桁） */
export const MANUFACTURER_CODE_DIGITS = 9;
/** 治験成分記号の桁数上限（手引き 5.1(1)：アルファベット及び数字で計20桁以内） */
export const COMPOUND_CODE_MAX = 20;
/** 薬効分類番号の桁数（手引き 5.2(10)：3桁） */
export const EFFICACY_CLASS_DIGITS = 3;

// ============================================================================
// デモ利用者（Entra ID の代替。職務分離＝起票者≠承認者 の検証に使用）
// ============================================================================
export interface DemoUser {
  id: string;
  name: string;
  initials: string;
  /** 権限の単一ソースは permissions.ts。viewer（未所属＝閲覧のみ）を含む */
  role: CtnRole;
  dept: string;
}
export const USERS: DemoUser[] = [
  { id: "u-a", name: "青木 亮介", initials: "AR", role: "drafter", dept: "臨床開発部" },
  { id: "u-b", name: "別府 美咲", initials: "BM", role: "reviewer", dept: "臨床開発部" },
  { id: "u-c", name: "千葉 健一", initials: "CK", role: "drafter", dept: "開発本部" },
  { id: "u-d", name: "土井 直樹", initials: "DN", role: "reviewer", dept: "薬事部" },
];
export const userById = (id: string) => USERS.find((u) => u.id === id);

// ---- 外部標準のコード表の種別 ----
export const CODE_KIND_LABEL: Record<CodeKind, string> = {
  dosageForm: "剤形コード",
  adminRoute: "投与経路コード",
  therapeuticClass: "薬効分類番号",
};
export const CODE_KINDS = Object.keys(CODE_KIND_LABEL) as CodeKind[];
/** ロール表示名の単一ソースは permissions.ts（viewer を含む） */
export const roleLabel = ROLE_LABEL;

// ============================================================================
// 外字 縮退マップ（代表例・デモ用）。本番は標準＋社内辞書。
// ============================================================================
export interface GaijiEntry {
  original: string;
  replacement: string;
  codePoint: string;
  gaijiType: number;
}
export const GAIJI_MAP: GaijiEntry[] = [
  { original: "髙", replacement: "高", codePoint: "U+9AD9", gaijiType: GAIJI_TYPE.platformDependent },
  { original: "﨑", replacement: "崎", codePoint: "U+FA11", gaijiType: GAIJI_TYPE.outOfJis },
  { original: "德", replacement: "徳", codePoint: "U+5FB3", gaijiType: GAIJI_TYPE.platformDependent },
  { original: "濵", replacement: "浜", codePoint: "U+6FF5", gaijiType: GAIJI_TYPE.outOfJis },
  { original: "淸", replacement: "清", codePoint: "U+6DF8", gaijiType: GAIJI_TYPE.outOfJis },
  { original: "眞", replacement: "真", codePoint: "U+771E", gaijiType: GAIJI_TYPE.platformDependent },
  { original: "邊", replacement: "辺", codePoint: "U+9089", gaijiType: GAIJI_TYPE.outOfJis },
  { original: "齋", replacement: "斎", codePoint: "U+9F4B", gaijiType: GAIJI_TYPE.outOfJis },
  { original: "曻", replacement: "昇", codePoint: "U+66FB", gaijiType: GAIJI_TYPE.pua },
  { original: "圡", replacement: "土", codePoint: "U+5721", gaijiType: GAIJI_TYPE.platformDependent },
];
export const gaijiFor = (ch: string) => GAIJI_MAP.find((g) => g.original === ch);

// ============================================================================
// 日付ヘルパ
// ============================================================================
export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
export const fmtDate = (s?: string): string => (s ? s.replace(/-/g, "/") : "—");
export const addDays = (s: string, days: number): string => {
  const dt = parseDate(s);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
/** a - b の日数（a,b は YYYY-MM-DD） */
export const daysBetween = (a: string, b: string): number => {
  const ms = parseDate(a).getTime() - parseDate(b).getTime();
  return Math.round(ms / 86_400_000);
};
/** 期限までの残日数（today基準・正=未来） */
export const daysUntil = (deadline?: string, today = TODAY): number | null =>
  deadline ? daysBetween(deadline, today) : null;

// 和暦っぽい短縮表示（デモ）
export const shortDate = (s?: string, lang: Lang = "ja"): string => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return lang === "ja" ? `${y}/${m}/${d}` : `${m}/${d}/${y}`;
};

// バイト数（Shift-JIS 近似: 全角2/半角1）— バイト数検証の表示に使用
export const byteLen = (s: string): number => {
  let n = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    n += code <= 0x7f || (code >= 0xff61 && code <= 0xff9f) ? 1 : 2;
  }
  return n;
};

export const initialsOf = (name: string): string => {
  const clean = name.replace(/\s/g, "");
  return clean.slice(0, 2);
};
