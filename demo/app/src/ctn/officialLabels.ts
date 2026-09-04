// ============================================================================
// officialLabels.ts — 入力画面のラベルを公式様式の項目名に一致させる対応表
// ----------------------------------------------------------------------------
// クライアントからの指摘（R-02 / R-07・2026-09 のレビュー）:
//   「入力画面が実際の届出のどの項目を指しているのかがわかりにくい」
//   「入力画面の項目名は実際の届出項目名に合わせた方がよい」
//
// そこで各入力欄に
//   ・公式様式そのままの項目名（label）
//   ・その値が届書のどこに出るか（path）
// を持たせる。path は届書の階層をそのまま並べたもので、画面に補助表示する。
// 「ここを打ったらどこに出るのか」という疑問に画面上で答えるのが目的。
//
// 【正しさの担保】
// path と label が実在することは officialLabels.test.ts が formTree.ts の
// 届書ツリーと突合して検証する。届書側の項目名を変えるとテストが落ちるので、
// 表とツリーがずれたまま放置されない。
//
// キーは「移行前の日本語ラベル」。UI 側の呼び出しを機械的に置き換えるための
// 一時的なキーではなく、そのまま画面の識別子として使い続ける。
// ============================================================================

export interface OfficialLabel {
  /** 公式様式の項目名（そのまま画面に出す） */
  ja: string;
  en: string;
  /** 届書の階層。末尾は ja と同じ項目名になる */
  path: string[];
}

/** 届書に出ない運用項目であることを示す（path を持たない） */
export interface InternalLabel {
  ja: string;
  en: string;
  /** 届書に出ない理由。画面のヒントに出す */
  internal: string;
}

export type LabelEntry = OfficialLabel | InternalLabel;

export const isInternal = (e: LabelEntry): e is InternalLabel => "internal" in e;

const MAIN = "主たる被験薬に関する届出事項";
const PLAN = [MAIN, "治験計画の概要"];
const MAIN_OTHER = [MAIN, "主たる被験薬のその他の情報"];
const NOTE_OTHER = [MAIN, "当該届出に関するその他の情報"];
const COMMON = "治験届出共通事項";
const OD = "治験使用薬、治験使用機器相当、治験使用製品相当（主たる被験薬を除く。）の情報";
const ODF = "治験使用薬、治験使用機器相当、治験使用製品相当（主たる被験薬を除く。）の届出事項";

export const LABELS: Record<string, LabelEntry> = {
  // ---- 治験届出共通事項 ----
  当該届出受付番号: { ja: "当該治験計画届出受付番号", en: "Receipt no. (this filing)", path: [COMMON, "当該治験計画届出受付番号"] },
  当該届出年月日: { ja: "当該治験計画届出年月日", en: "Filing date (this filing)", path: [COMMON, "当該治験計画届出年月日"] },
  "30日調査対応被験薬区分": { ja: "主たる被験薬の30 日調査対応被験薬区分", en: "30-day review category", path: [MAIN, "主たる被験薬の30 日調査対応被験薬区分"] },

  // ---- 届出事項 ----
  届出区分: { ja: "届出区分", en: "Submission category", path: [MAIN, "届出区分"] },
  中止年月日: { ja: "中止日年月日", en: "Termination date", path: [MAIN, "中止情報", "中止日年月日"] },
  中止理由: { ja: "中止理由", en: "Termination reason", path: [MAIN, "中止情報", "中止理由"] },
  その後の対応状況: { ja: "その後の対応状況", en: "Follow-up status", path: [MAIN, "中止情報", "その後の対応状況"] },
  "備考（通信欄）": { ja: "内容", en: "Remarks", path: [MAIN, "備考", "内容"] },
  様式等のバージョン情報: { ja: "様式等のバージョン情報", en: "Form version", path: ["様式等のバージョン情報"] },

  // ---- 治験計画の概要 ----
  実施計画書識別記号: { ja: "実施計画書識別記号", en: "Protocol ID", path: [...PLAN, "実施計画書識別記号"] },
  開発の相: { ja: "開発の相", en: "Development phase", path: [...PLAN, "開発の相"] },
  試験の種類: { ja: "試験の種類", en: "Study type", path: [...PLAN, "試験の種類"] },
  目的: { ja: "目的", en: "Objectives", path: [...PLAN, "目的"] },
  "予定被験者数（被験薬）": { ja: "予定被験者数（被験薬）", en: "Planned subjects (drug)", path: [...PLAN, "予定被験者数情報", "予定被験者数（被験薬）"] },
  "予定被験者数（合計）": { ja: "予定被験者数（合計）", en: "Planned subjects (total)", path: [...PLAN, "予定被験者数情報", "予定被験者数（合計）"] },
  主たる被験薬の対象疾患: { ja: "主たる被験薬の対象疾患", en: "Target disease", path: [...PLAN, "主たる被験薬の対象疾患"] },
  "実施期間（開始）": { ja: "開始日年月日", en: "Period (start)", path: [...PLAN, "実施期間", "開始日年月日"] },
  "実施期間（終了）": { ja: "終了日年月日", en: "Period (end)", path: [...PLAN, "実施期間", "終了日年月日"] },
  有償の理由等: { ja: "有償の理由等", en: "Reason for charging", path: [...PLAN, "有償の理由等"] },
  費用負担者氏名: { ja: "費用負担者氏名", en: "Cost bearer", path: [...PLAN, "治験の費用負担者に関する情報", "費用負担者氏名"] },
  費用負担の妥当性の理由: { ja: "妥当性", en: "Validity", path: [...PLAN, "治験の費用負担者に関する情報", "妥当性"] },
  "治験調整医師 氏名": { ja: "治験調整医師の氏名", en: "Coordinating investigator", path: [...PLAN, "治験調整医師又は治験調整委員会構成医師に関する情報", "治験調整医師の氏名"] },
  医療機関名: { ja: "治験調整医師の所属機関", en: "Institution", path: [...PLAN, "治験調整医師又は治験調整委員会構成医師に関する情報", "治験調整医師の所属機関"] },
  所属: { ja: "治験調整医師の所属", en: "Affiliation", path: [...PLAN, "治験調整医師又は治験調整委員会構成医師に関する情報", "治験調整医師の所属"] },

  // ---- CRO（公式の見出しは非常に長いので path で示す） ----
  "CRO 名称": { ja: "氏名", en: "CRO name", path: [...PLAN, "治験の依頼（準備）及び管理に関する業務の全部又は一部を受託する者（開発業務受託機関（ＣＲＯ））の氏名、住所及び委託する業務の範囲", "氏名"] },
  "CRO 所在地1": { ja: "住所１", en: "CRO address 1", path: [...PLAN, "治験の依頼（準備）及び管理に関する業務の全部又は一部を受託する者（開発業務受託機関（ＣＲＯ））の氏名、住所及び委託する業務の範囲", "住所１"] },
  "CRO 所在地2": { ja: "住所２", en: "CRO address 2", path: [...PLAN, "治験の依頼（準備）及び管理に関する業務の全部又は一部を受託する者（開発業務受託機関（ＣＲＯ））の氏名、住所及び委託する業務の範囲", "住所２"] },
  "CRO 受託業務の範囲": { ja: "委託する業務の範囲", en: "CRO scope", path: [...PLAN, "治験の依頼（準備）及び管理に関する業務の全部又は一部を受託する者（開発業務受託機関（ＣＲＯ））の氏名、住所及び委託する業務の範囲", "委託する業務の範囲"] },

  // ---- 主たる被験薬のその他の情報 ----
  "カルタヘナ法 該当有無": { ja: "該当の有無等", en: "Cartagena applicability", path: [...MAIN_OTHER, "カルタヘナ法の対象となる薬物を用いる治験", "該当の有無等"] },
  "カルタヘナ法 詳細": { ja: "該当する場合の詳述", en: "Cartagena detail", path: [...MAIN_OTHER, "カルタヘナ法の対象となる薬物を用いる治験", "該当する場合の詳述"] },
  "生物由来製品 該当有無": { ja: "該当の有無等", en: "Biological product applicability", path: [...MAIN_OTHER, "生物由来製品に指定が見込まれる薬物を用いる治験", "該当の有無等"] },
  コンパニオン診断薬等の開発: { ja: "該当の有無", en: "Companion diagnostics", path: [...MAIN_OTHER, "対応するコンパニオン診断薬等の開発", "該当の有無"] },
  コンビネーション製品に関する治験: { ja: "該当の有無", en: "Combination product", path: [...MAIN_OTHER, "コンビネーション製品に関する治験", "該当の有無"] },
  "その他コメント（主たる被験薬）": { ja: "その他", en: "Other (main drug)", path: [...MAIN_OTHER, "その他"] },

  // ---- 当該届出に関するその他の情報 ----
  "臨床試験の位置付け（拡大治験）": { ja: "該当の有無等", en: "Trial positioning", path: [...NOTE_OTHER, "臨床試験の位置付け", "該当の有無等"] },
  国際共同治験: { ja: "該当の有無", en: "Global trial", path: [...NOTE_OTHER, "国際共同治験", "該当の有無"] },
  国際共同治験の内容: { ja: "内容", en: "Global trial detail", path: [...NOTE_OTHER, "国際共同治験", "内容"] },
  ゲノム検査等を含む治験: { ja: "該当の有無等", en: "Genomic testing", path: [...NOTE_OTHER, "ゲノム検査等を含む治験", "該当の有無等"] },
  マイクロドーズ臨床試験: { ja: "該当の有無等", en: "Microdose study", path: [...NOTE_OTHER, "マイクロドーズ臨床試験を利用した開発品目", "該当の有無等"] },
  併用する機械器具等の記載: { ja: "該当の有無", en: "Combined equipment", path: [...NOTE_OTHER, "当該届出に関する治験に併用する機械器具等の記載", "該当の有無"] },
  "併用する機械器具等 内容": { ja: "内容", en: "Combined equipment detail", path: [...NOTE_OTHER, "当該届出に関する治験に併用する機械器具等の記載", "内容"] },
  "その他コメント（治験計画書）": { ja: "その他", en: "Other (this filing)", path: [...NOTE_OTHER, "その他"] },

  // ---- 主たる被験薬（薬の明細） ----
  製造所名称: { ja: "名称", en: "Plant name", path: [MAIN, "主たる被験薬の製造所又は営業所（治験薬提供者）の名称及び所在地", "名称"] },
  製造所所在地1: { ja: "所在地１", en: "Plant address 1", path: [MAIN, "主たる被験薬の製造所又は営業所（治験薬提供者）の名称及び所在地", "所在地１"] },
  製造所所在地2: { ja: "所在地２", en: "Plant address 2", path: [MAIN, "主たる被験薬の製造所又は営業所（治験薬提供者）の名称及び所在地", "所在地２"] },
  製造所業者コード: { ja: "業者コード", en: "Plant code", path: [MAIN, "主たる被験薬の製造所又は営業所（治験薬提供者）の名称及び所在地", "業者コード"] },
  成分及び分量: { ja: "成分及び分量", en: "Ingredients", path: [MAIN, "主たる被験薬の成分及び分量情報", "成分及び分量"] },
  剤形コード: { ja: "剤形コード", en: "Dosage form code", path: [MAIN, "主たる被験薬の成分及び分量情報", "剤形コード情報", "剤形コード"] },
  製造方法: { ja: "主たる被験薬の製造方法", en: "Manufacturing method", path: [MAIN, "主たる被験薬の製造方法"] },
  予定される効能効果: { ja: "予定される効能又は効果", en: "Intended indication", path: [MAIN, "主たる被験薬の予定される効能又は効果情報", "予定される効能又は効果"] },
  薬効分類番号: { ja: "薬効分類番号", en: "Therapeutic class code", path: [MAIN, "主たる被験薬の予定される効能又は効果情報", "薬効分類番号"] },
  予定される用法用量: { ja: "予定される用法及び用量", en: "Intended dosage", path: [MAIN, "主たる被験薬の予定される用法及び用量情報", "予定される用法及び用量"] },
  投与経路コード: { ja: "投与経路コード", en: "Route code", path: [MAIN, "主たる被験薬の予定される用法及び用量情報", "投与経路コード情報", "投与経路コード"] },
  用法及び用量: { ja: "用法及び用量", en: "Dosage and administration", path: [...PLAN, "主たる被験薬の用法及び用量情報", "用法及び用量"] },

  // ---- その他治験使用薬（主たる被験薬を除く）。薬の明細画面は主従で同じ部品を
  //      使い回すため、主たる被験薬と別のパスを持つ項目は「（薬別）」で分ける ----
  "30日調査対応被験薬区分（薬別）": { ja: "30 日調査対応被験薬区分", en: "30-day review category (drug)", path: [OD, ODF, "30 日調査対応被験薬区分"] },
  "国内における承認状況": { ja: "国内における承認状況", en: "Domestic approval status", path: [OD, "国内における承認状況"] },
  "副作用報告の有無": { ja: "副作用報告の有無", en: "ADR report", path: [OD, ODF, "副作用報告の有無"] },
  "対象疾患（薬別）": { ja: "対象疾患", en: "Target disease (drug)", path: [OD, ODF, "治験計画の概要", "対象疾患"] },
  "その他備考（薬別）": { ja: "その他備考", en: "Other remarks (drug)", path: [OD, ODF, "その他備考"] },
  "製造所名称（薬別）": { ja: "製造所又は営業所（治験薬提供者）の名称及び所在地", en: "Plant (drug)", path: [OD, ODF, "製造所又は営業所（治験薬提供者）の名称及び所在地"] },
  "成分及び分量（薬別）": { ja: "成分及び分量", en: "Ingredients (drug)", path: [OD, ODF, "成分及び分量情報", "成分及び分量"] },
  "剤形コード（薬別）": { ja: "剤形コード", en: "Dosage form code (drug)", path: [OD, ODF, "成分及び分量情報", "剤形コード情報", "剤形コード"] },
  "製造方法（薬別）": { ja: "製造方法", en: "Manufacturing method (drug)", path: [OD, ODF, "製造方法"] },
  "予定される効能効果（薬別）": { ja: "予定される効能又は効果", en: "Intended indication (drug)", path: [OD, ODF, "予定される効能又は効果情報", "予定される効能又は効果"] },
  "薬効分類番号（薬別）": { ja: "薬効分類番号", en: "Therapeutic class code (drug)", path: [OD, ODF, "予定される効能又は効果情報", "薬効分類番号"] },
  "予定される用法用量（薬別）": { ja: "予定される用法及び用量", en: "Intended dosage (drug)", path: [OD, ODF, "予定される用法及び用量情報", "予定される用法及び用量"] },
  "投与経路コード（薬別）": { ja: "投与経路コード", en: "Route code (drug)", path: [OD, ODF, "予定される用法及び用量情報", "投与経路コード情報", "投与経路コード"] },
  "用法及び用量（薬別）": { ja: "用法及び用量", en: "Dosage and administration (drug)", path: [OD, ODF, "治験計画の概要", "用法及び用量情報", "用法及び用量"] },
  "カルタヘナ法 該当有無（薬別）": { ja: "該当の有無等", en: "Cartagena applicability (drug)", path: [OD, ODF, "その他の情報", "カルタヘナ法の対象となる薬物を用いる治験", "該当の有無等"] },
  "生物由来製品 該当有無（薬別）": { ja: "該当の有無等", en: "Biological applicability (drug)", path: [OD, ODF, "その他の情報", "生物由来製品に指定が見込まれる薬物を用いる治験", "該当の有無等"] },
  "コンパニオン診断薬等の開発（薬別）": { ja: "該当の有無", en: "Companion diagnostics (drug)", path: [OD, ODF, "その他の情報", "対応するコンパニオン診断薬等の開発", "該当の有無"] },
  "コンビネーション製品に関する治験（薬別）": { ja: "該当の有無", en: "Combination product (drug)", path: [OD, ODF, "その他の情報", "コンビネーション製品に関する治験", "該当の有無"] },

  // ---- 実施医療機関情報 ----
  実施診療科: { ja: "実施診療科", en: "Department", path: ["実施医療機関情報", "実施医療機関ごとの事項", "実施診療科"] },
  予定被験者数: { ja: "実施医療機関予定被験者数", en: "Planned subjects (site)", path: ["実施医療機関情報", "実施医療機関ごとの事項", "実施医療機関予定被験者数"] },
  実施医療機関被験者数: { ja: "実施医療機関被験者数", en: "Enrolled subjects (site)", path: ["実施医療機関情報", "実施医療機関ごとの事項", "実施医療機関被験者数"] },
  SMO名称: { ja: "氏名", en: "SMO name", path: ["実施医療機関情報", "実施医療機関ごとの事項", "治験の実施に関する業務の一部を実施医療機関から受託する者（治験施設支援機関（ＳＭＯ）等）の氏名、住所及び委託する業務の範囲", "氏名"] },
  SMO住所1: { ja: "住所１", en: "SMO address 1", path: ["実施医療機関情報", "実施医療機関ごとの事項", "治験の実施に関する業務の一部を実施医療機関から受託する者（治験施設支援機関（ＳＭＯ）等）の氏名、住所及び委託する業務の範囲", "住所１"] },
  SMO住所2: { ja: "住所２", en: "SMO address 2", path: ["実施医療機関情報", "実施医療機関ごとの事項", "治験の実施に関する業務の一部を実施医療機関から受託する者（治験施設支援機関（ＳＭＯ）等）の氏名、住所及び委託する業務の範囲", "住所２"] },
  SMO委託業務範囲: { ja: "委託する業務の範囲", en: "SMO scope", path: ["実施医療機関情報", "実施医療機関ごとの事項", "治験の実施に関する業務の一部を実施医療機関から受託する者（治験施設支援機関（ＳＭＯ）等）の氏名、住所及び委託する業務の範囲", "委託する業務の範囲"] },
  IRB: { ja: "治験審査委員会の設置者の名称", en: "IRB owner", path: ["実施医療機関情報", "実施医療機関ごとの事項", "治験審査委員会に関する情報", "治験審査委員会の設置者の名称"] },
  その他: { ja: "その他", en: "Other", path: ["実施医療機関情報", "実施医療機関ごとの事項", "その他"] },
  脚注: { ja: "脚注", en: "Footnote", path: ["実施医療機関情報", "脚注"] },

  // ---- 届書に出ない運用項目（届書項目と混同されていたもの） ----
  治験開始予定日: {
    ja: "治験開始予定日",
    en: "Planned start date",
    internal:
      "提出期限の起点です（30日調査対象は−30日／N回届は−14日）。届書には出力されませんが、" +
      "実施期間の開始日とは別に入力してください（実施期間は準備期間を含む場合があるため）。",
  },
  GW受付番号: {
    ja: "GW受付番号",
    en: "Gateway receipt no.",
    internal: "提出後に PMDA 受付完了メールから記録する運用項目。届書には出力されません。",
  },
};

/** 公式項目名（見つからなければ渡された名前をそのまま返す） */
export function ofLabel(key: string, lang: "ja" | "en" = "ja"): string {
  const e = LABELS[key];
  if (!e) return key;
  return lang === "ja" ? e.ja : e.en;
}

/**
 * 「この欄が届書のどこに出るか」の表示。届書に出ない運用項目はその旨を返す。
 * 末尾の項目名はラベルと重複するので落とす。
 */
export function ofHint(key: string): string {
  const e = LABELS[key];
  if (!e) return "";
  if (isInternal(e)) return `※ ${e.internal}`;
  const parents = e.path.slice(0, -1);
  return parents.length ? `届書：${parents.join(" › ")}` : "";
}

/**
 * 画面用のラベル取得子を作る。コンポーネントごとに
 *   const ofl = oflWith(t);
 * として使う（t は useLang の翻訳関数）。
 */
export const oflWith =
  (t: (en: string, ja: string) => string) =>
  (key: string): string =>
    t(ofLabel(key, "en"), ofLabel(key, "ja"));
