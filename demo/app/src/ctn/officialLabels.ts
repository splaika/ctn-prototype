// ============================================================================
// officialLabels.ts — 入力欄を公式様式の項目名に結び付ける
// ----------------------------------------------------------------------------
// クライアントからの指摘（R-02 / R-07・2026-09 のレビュー）:
//   「入力画面が実際の届出のどの項目を指しているのかがわかりにくい」
//   「入力画面の項目名は実際の届出項目名に合わせた方がよい」
//
// 【この表が持つのは「要素名」だけ】
// 以前はここに項目名（ja）と届書の階層（path）を手で書いていた。宣言なので
// 公式XSDとずれても実行時に気づけず、16欄が公式名になっていなかった。
// いまは各入力欄に対して**XSDの要素名だけ**を宣言し、項目名と階層は
// xsdLabels.ts が xsdForm.generated.ts（＝厚生労働省のXSD）から引く。
// これで画面ラベルは定義上つねに公式と一致する。
//
// 【同じ要素名が複数箇所にあるもの】
// APPLICABLEORNOT / CONTENTS / DETAIL などはXSD上の別位置で別の項目名を持つ
// （「該当の有無」と「該当の有無等」など）。その場合は under に親要素名を書く。
//
// 【届書に出ない運用項目】
// internal を持つ項目は届書に出力されない。届書項目と混同されていたものが
// あったため、理由を画面のヒントに必ず出す。
// ============================================================================
import { isAmbiguous, xsdEntry } from "./xsdLabels";

export interface OfficialLabel {
  /** 公式様式の項目名（XSDから引いたもの。そのまま画面に出す） */
  ja: string;
  en: string;
  /** 届書の階層。末尾は ja と同じ項目名になる */
  path: string[];
  /** XSD の要素名 */
  el: string;
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

/** 入力欄の宣言。ja / path はXSDから引くのでここには書かない */
interface FieldSpec {
  el: string;
  /** 同名要素がXSD上の複数箇所にある場合の親要素名 */
  under?: string;
  en: string;
}

type Spec = FieldSpec | InternalLabel;
const isSpecInternal = (s: Spec): s is InternalLabel => "internal" in s;

// ---------------------------------------------------------------------------
// 入力欄 → XSD の要素名
// ---------------------------------------------------------------------------
// キーは画面側の識別子。値は要素名（＋必要なら親要素名）と英語ラベルだけ。
// 「（薬別）」が付くキーはその他治験使用薬（主たる被験薬を除く。）側の欄で、
// 主たる被験薬とは届書の出力先が違うため別キーにしている（薬明細の画面は
// 主従で同じ部品を使い回すため）。
const FIELDS: Record<string, Spec> = {
  // ---- 様式・治験届出共通事項 ----
  様式等のバージョン情報: { el: "INFOFORMVERSION", en: "Form version" },
  治験成分記号: { el: "TESTSUBSTANCEIDCODE", en: "Compound code" },
  治験の種類: { el: "TYPECLINTRIALS", en: "Trial kind" },
  初回届出受付番号: { el: "RECEPTNUMINITNOTE", en: "Receipt no. (first filing)" },
  初回届出年月日: { el: "INITNOTEDATE", en: "Filing date (first)" },
  届出回数: { el: "SERIALNOTENUM", en: "Filing count" },
  当該届出受付番号: { el: "RECEPTNUMCLINTRIALPLANNOTE", en: "Receipt no. (this filing)" },
  当該届出年月日: { el: "CLINTRIALPLANNOTEDATE", en: "Filing date (this filing)" },

  // ---- 主たる被験薬に関する届出事項 ----
  届出年月日: { el: "NOTEDATE", en: "Note date" },
  届出分類: { el: "CLASSNOTE", en: "Notification class" },
  変更回数: { el: "TIMESCHANGE", en: "Change count" },
  届出区分: { el: "CATEGORYNOTE", en: "Submission category" },
  "30日調査対応被験薬区分": { el: "CATEGTESTPRODUCTSUBJ30DAYREVIEW", en: "30-day review category" },
  中止年月日: { el: "TERMINATIONDATE", en: "Termination date" },
  中止理由: { el: "REASONTERMINATION", en: "Termination reason" },
  その後の対応状況: { el: "POSTTERMINATIONMEASURE", en: "Follow-up status" },
  "備考（通信欄）": { el: "DETAIL", under: "REMARKS", en: "Remarks" },

  // ---- 治験計画の概要 ----
  実施計画書識別記号: { el: "PROTOCOLNUM", en: "Protocol ID" },
  開発の相: { el: "PHASECLINTRIAL", en: "Development phase" },
  試験の種類: { el: "TYPECLINTRIAL", en: "Study type" },
  目的: { el: "TRIALOBJECTIVES", en: "Objectives" },
  "予定被験者数（被験薬）": { el: "PLANNUMSUBJTESTPRODUCT", en: "Planned subjects (drug)" },
  "予定被験者数（合計）": { el: "PLANNUMSUBJECTSTOTAL", en: "Planned subjects (total)" },
  主たる被験薬の対象疾患: { el: "TARGETDISEASE", en: "Target disease" },
  "実施期間（開始）": { el: "STARTDATECLINTRIAL", en: "Period (start)" },
  "実施期間（終了）": { el: "ENDDATECLINTRIAL", en: "Period (end)" },
  有償の理由等: { el: "REASONONEROUS", en: "Reason for charging" },
  費用負担者氏名: { el: "CHARGEOUTPERSONNAME", en: "Cost bearer" },
  費用負担の妥当性の理由: { el: "VALIDITYREASONS", en: "Validity" },
  "治験調整医師 氏名": { el: "KEYINVEST_NAME", en: "Coordinating investigator" },
  医療機関名: { el: "NAMEMEDICALINSTITUT", en: "Institution" },
  所属: { el: "KEYINVEST_AFFILIATION", en: "Affiliation" },
  "CRO 名称": { el: "CRO_NAME", en: "CRO name" },
  "CRO 所在地1": { el: "CRO_ADDRESS1", en: "CRO address 1" },
  "CRO 所在地2": { el: "CRO_ADDRESS2", en: "CRO address 2" },
  "CRO 受託業務の範囲": { el: "CRO_SERVICE", en: "CRO scope" },

  // ---- 主たる被験薬のその他の情報 ----
  "カルタヘナ法 該当有無": { el: "TYPECLINTRIALWITHDRUGCARTAGENA", under: "INFOCLINTRIALWITHDRUGCARTAGENA", en: "Cartagena applicability" },
  "カルタヘナ法 詳細": { el: "DETAIL", under: "INFOCLINTRIALWITHDRUGCARTAGENA", en: "Cartagena detail" },
  "生物由来製品 該当有無": { el: "TYPEBIOLOGICALPROD", under: "INFOCLINTRIALWITHBIOLOGICALPROD", en: "Biological product applicability" },
  コンパニオン診断薬等の開発: { el: "APPLICABLEORNOT", under: "INFORESEARCHFORCODX", en: "Companion diagnostics" },
  コンビネーション製品に関する治験: { el: "APPLICABLEORNOT", under: "INFOCLINTRIALFORCOMBINATIONPROD", en: "Combination product" },
  "その他コメント（主たる被験薬）": { el: "OTHERCOMMENTS_PRIMARY", en: "Other (main drug)" },

  // ---- 当該届出に関するその他の情報 ----
  "臨床試験の位置付け（拡大治験）": { el: "TYPEEXPANDEDACCESSPROG", under: "INFOEXPANDEDACCESSPROG", en: "Trial positioning" },
  国際共同治験: { el: "APPLICABLEORNOT", under: "INFOGLOBALCLINTRIAL", en: "Global trial" },
  国際共同治験の内容: { el: "CONTENTS", under: "INFOGLOBALCLINTRIAL", en: "Global trial detail" },
  ゲノム検査等を含む治験: { el: "APPLICABLEORNOT", under: "INFOCLINTRIALINCLUDINGGENETEST", en: "Genomic testing" },
  マイクロドーズ臨床試験: { el: "APPLICABLEORNOT", under: "INFOPRODUSINGMDCLINTRIAL", en: "Microdose study" },
  併用する機械器具等の記載: { el: "APPLICABLEORNOT", under: "INFOCOMBEQUIPMENT", en: "Combined equipment" },
  "併用する機械器具等 内容": { el: "CONTENTS", under: "INFOCOMBEQUIPMENT", en: "Combined equipment detail" },
  "その他コメント（治験計画書）": { el: "OTHERCOMMENTS_PROTOCOL", en: "Other (this filing)" },

  // ---- 主たる被験薬（薬の明細） ----
  製造所名称: { el: "SPONSOR_NAME", en: "Plant name" },
  製造所所在地1: { el: "SPONSOR_ADDRESS1", en: "Plant address 1" },
  製造所所在地2: { el: "SPONSOR_ADDRESS2", en: "Plant address 2" },
  製造所業者コード: { el: "MANUFACTURERIMPORTERCODE", under: "INFONAMEADDRESSMANUFACTPLANT", en: "Plant code" },
  成分及び分量: { el: "INGREDIENTSQUANTITIES", en: "Ingredients" },
  剤形コード: { el: "DOSAGEFORMCODE", en: "Dosage form code" },
  製造方法: { el: "MANUFACTMETHOD", en: "Manufacturing method" },
  予定される効能効果: { el: "INTENDINDICATIONSEFFECTS", en: "Intended indication" },
  薬効分類番号: { el: "EFFICACYCLASSCODENUMBER", en: "Therapeutic class code" },
  予定される用法用量: { el: "INTENDDOSAGEADMIN", en: "Intended dosage" },
  // 投与経路コードはXSD上2か所（予定される用法及び用量情報／治験計画の概要の
  // 用法及び用量情報）にあり、項目名は同一で同じ値が両方に出力される。
  // ヒントには先に出てくる「予定される用法及び用量情報」側の階層を出す。
  投与経路コード: { el: "ADMINROUTECODE", under: "INFOADMINROUTECODE", en: "Route code" },
  用法及び用量: { el: "DOSAGEADMIN", en: "Dosage and administration" },

  // ---- その他治験使用薬（主たる被験薬を除く。）----
  "医薬品等の別（薬別）": { el: "COMB_PRODUCTCATEGORY", en: "Product category (drug)" },
  "治験薬名称（薬別）": { el: "COMBINATION_ID", en: "Drug name (drug)" },
  "記号・名称等の種類": { el: "TYPECOMBINATION_ID", en: "ID type" },
  "記号・名称等の種類 詳述": { el: "DETAIL", under: "INFOCOMBINATIONID", en: "ID type — other detail" },
  区別: { el: "COMBINATIONCATEGORY", en: "Category" },
  区別の詳述: { el: "OTHERCOMBINATIONCATEGORY", en: "Category — other detail" },
  国内における承認状況: { el: "COMB_APPLICATIONSTATUS", en: "Domestic approval status" },
  "30日調査対応被験薬区分（薬別）": { el: "COMB_CATEGTESTPRODUCTSUBJ30DAYREVIEW", en: "30-day review category (drug)" },
  副作用報告の有無: { el: "COMB_PRESENCEADRREPORT", en: "ADR report" },
  "対象疾患（薬別）": { el: "COMB_TARGETDISEASE", en: "Target disease (drug)" },
  "その他備考（薬別）": { el: "COMB_REMARKS", en: "Other remarks (drug)" },
  "その他コメント（薬別）": { el: "OTHERCOMMENTS", under: "COMB_OTHERCOMMENTS", en: "Other (drug)" },
  "製造所名称（薬別）": { el: "COMB_SPONSOR_NAME", en: "Plant name (drug)" },
  "製造所所在地1（薬別）": { el: "COMB_SPONSOR_ADDRESS1", en: "Plant address 1 (drug)" },
  "製造所所在地2（薬別）": { el: "COMB_SPONSOR_ADDRESS2", en: "Plant address 2 (drug)" },
  "製造所業者コード（薬別）": { el: "COMB_MANUFACTURERIMPORTERCODE", en: "Plant code (drug)" },
  "成分及び分量（薬別）": { el: "COMB_INGREDIENTSQUANTITIES", en: "Ingredients (drug)" },
  "剤形コード（薬別）": { el: "COMB_DOSAGEFORMCODE", en: "Dosage form code (drug)" },
  "製造方法（薬別）": { el: "COMB_MANUFACTMETHOD", en: "Manufacturing method (drug)" },
  "予定される効能効果（薬別）": { el: "COMB_INTENDINDICATIONSEFFECTS", en: "Intended indication (drug)" },
  "薬効分類番号（薬別）": { el: "COMB_EFFICACYCLASSCODENUMBER", en: "Therapeutic class code (drug)" },
  "予定される用法用量（薬別）": { el: "COMB_INTENDDOSAGEADMIN", en: "Intended dosage (drug)" },
  "投与経路コード（薬別）": { el: "COMB_ADMINROUTECODE", under: "COMB_INFOADMINROUTECODE", en: "Route code (drug)" },
  "用法及び用量（薬別）": { el: "COMB_DOSAGEADMIN", en: "Dosage and administration (drug)" },
  "カルタヘナ法 該当有無（薬別）": { el: "TYPECLINTRIALWITHDRUGCARTAGENA", under: "COMB_INFOCLINTRIALWITHDRUGCARTAGENA", en: "Cartagena applicability (drug)" },
  "カルタヘナ法 詳細（薬別）": { el: "DETAIL", under: "COMB_INFOCLINTRIALWITHDRUGCARTAGENA", en: "Cartagena detail (drug)" },
  "生物由来製品 該当有無（薬別）": { el: "TYPEBIOLOGICALPROD", under: "COMB_INFOCLINTRIALWITHBIOLOGICALPROD", en: "Biological applicability (drug)" },
  "コンパニオン診断薬等の開発（薬別）": { el: "APPLICABLEORNOT", under: "COMB_INFORESEARCHFORCODX", en: "Companion diagnostics (drug)" },
  "コンビネーション製品に関する治験（薬別）": { el: "APPLICABLEORNOT", under: "COMB_INFOCLINTRIALFORCOMBINATIONPROD", en: "Combination product (drug)" },

  // ---- 治験届出者に関する情報 ----
  治験届出者の種別: { el: "CLASSPERSONFILLNOTE", en: "Notifier type" },
  届出者の名称: { el: "APPLICAT_NAME", en: "Notifier name" },
  届出者の代表者氏名: { el: "APPLICAT_REP_NAME", en: "Notifier representative" },
  届出者所在地1: { el: "APPLICAT_ADDRESS1", en: "Notifier address 1" },
  届出者所在地2: { el: "APPLICAT_ADDRESS2", en: "Notifier address 2" },
  届出者業者コード: { el: "MANUFACTURERIMPORTERCODE", under: "INFOPERSONFILLNOTE", en: "Notifier code" },
  担当者の氏名: { el: "APPLICAT_PERSON_NAME", en: "Contact name" },
  担当者の所属: { el: "APPLICAT_PERSON_TITLE", en: "Contact title" },
  担当者電話番号: { el: "APPLICAT_TELNUM", en: "Contact tel" },
  "担当者FAX番号又はメールアドレス": { el: "FAXNUMBER", en: "Contact fax / mail" },

  // ---- 海外依頼者、外国製造業者（届出者側／薬別）----
  "海外依頼者 名称（邦文）": { el: "FOREIGN_SPONSOR_NAME", en: "Foreign sponsor name (JP)" },
  "海外依頼者 氏名（邦文）": { el: "FOREIGN_SPONSOR_REP_NAME", en: "Foreign sponsor rep. (JP)" },
  "海外依頼者 所在地1（邦文）": { el: "FOREIGN_SPONSOR_ADDRESS1", en: "Foreign address 1 (JP)" },
  "海外依頼者 所在地2（邦文）": { el: "FOREIGN_SPONSOR_ADDRESS2", en: "Foreign address 2 (JP)" },
  "海外依頼者 名称（外国文）": { el: "FOREIGN_NAME_FRGNLNG", en: "Foreign sponsor name" },
  "海外依頼者 氏名（外国文）": { el: "FOREIGN_SPOMSPR_REP_NAME_FRGNLNG", en: "Foreign sponsor rep." },
  "海外依頼者 所在地1（外国文）": { el: "FOREIGN_ADDRESS1_FRGNLNG", en: "Foreign address 1" },
  "海外依頼者 所在地2（外国文）": { el: "FOREIGN_ADDRESS2_FRGNLNG", en: "Foreign address 2" },
  "海外依頼者 名称（邦文・薬別）": { el: "COMB_FOREIGN_SPONSOR_NAME", en: "Foreign sponsor name (JP, drug)" },
  "海外依頼者 氏名（邦文・薬別）": { el: "COMB_FOREIGN_SPONSOR_REP_NAME", en: "Foreign sponsor rep. (JP, drug)" },
  "海外依頼者 所在地1（邦文・薬別）": { el: "COMB_FOREIGN_SPONSOR_ADDRESS1", en: "Foreign address 1 (JP, drug)" },
  "海外依頼者 所在地2（邦文・薬別）": { el: "COMB_FOREIGN_SPONSOR_ADDRESS2", en: "Foreign address 2 (JP, drug)" },
  "海外依頼者 名称（外国文・薬別）": { el: "COMB_FOREIGN_NAME_FRGNLNG", en: "Foreign sponsor name (drug)" },
  "海外依頼者 氏名（外国文・薬別）": { el: "COMB_FOREIGN_SPOMSPR_REP_NAME_FRGNLNG", en: "Foreign sponsor rep. (drug)" },
  "海外依頼者 所在地1（外国文・薬別）": { el: "COMB_FOREIGN_ADDRESS1_FRGNLNG", en: "Foreign address 1 (drug)" },
  "海外依頼者 所在地2（外国文・薬別）": { el: "COMB_FOREIGN_ADDRESS2_FRGNLNG", en: "Foreign address 2 (drug)" },

  // ---- 実施医療機関情報 ----
  実施医療機関の名称: { el: "INSTITUTE_NAME", en: "Institution name" },
  実施診療科: { el: "DEPARTMENT", en: "Department" },
  予定被験者数: { el: "PLANNUMSUBJMEDICALINSTUTUT", en: "Planned subjects (site)" },
  実施医療機関被験者数: { el: "NUMSUBJENROLLINSTITUTION", en: "Enrolled subjects (site)" },
  SMO名称: { el: "SMO_NAME", en: "SMO name" },
  SMO住所1: { el: "SMO_ADDRESS1", en: "SMO address 1" },
  SMO住所2: { el: "SMO_ADDRESS2", en: "SMO address 2" },
  SMO委託業務範囲: { el: "SMO_SERVICE", en: "SMO scope" },
  IRB: { el: "IRB_OWNER_NAME", en: "IRB owner" },
  その他: { el: "OTHERS", en: "Other" },
  脚注: { el: "FOOTNOTE", en: "Footnote" },
  治験責任医師の氏名: { el: "CHIEFINVEST_NAME", en: "Principal investigator" },
  治験分担医師の氏名: { el: "INVESTIGATER_NAME", en: "Sub-investigator" },
  大学番号: { el: "NUMMEDICALSCHOOL", en: "Medical school no." },
  卒業年: { el: "GRADUATYEARMEDICALSCHOOL", en: "Graduation year" },
  氏名よみかな: { el: "CHIEFINVEST_PRONOUNCE", under: "INFOINVESTIGATOR", en: "Name (kana)" },

  // ---- 治験使用薬数量情報 ----
  治験使用薬の名称: { el: "NAMEINVESTPRODUCT", en: "Investigational product" },
  "予定交付（入手）数量": { el: "QUANTITIESPLANNED", en: "Planned quantity" },
  交付数量: { el: "QUANTITIESSUPPLIED", en: "Supplied" },
  使用数量: { el: "QUANTITIESUSED", en: "Used" },
  回収数量: { el: "QUANTITIESWITHDRAWN", en: "Withdrawn" },
  廃棄数量: { el: "QUANTITIESABROGATED", en: "Abrogated" },

  // ---- 届書添付資料 ----
  資料名: { el: "NAMEDOC", en: "Document name" },
  届書添付資料の備考: { el: "REMARK", en: "Attachment remarks" },

  // ---- 参照する治験届出情報 ----
  "医薬品等の別（参照）": { el: "REF_PRODUCTCATEGORY", en: "Product category (ref.)" },
  参照成分記号: { el: "REF_INFOTESTSUBSTANCEIDCODE", en: "Compound / ID code (ref.)" },
  "届出回数（参照）": { el: "REF_SERIALNOTENUM", en: "Filing count (ref.)" },
  参照の区分: { el: "TYPEREFFERENCE", en: "Reference type" },
  参照の詳細: { el: "CONTENTS", under: "INFOREFCLINTRIALPLANNOTER", en: "Reference detail" },

  // ---- 届書に出ない運用項目 ----
  // 届書項目と混同されていたもの。理由を必ず画面のヒントに出す。
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
  主従区分: {
    ja: "主従区分",
    en: "Role",
    internal:
      "主たる被験薬か、その他治験使用薬かの区別です。届書には出力されませんが、" +
      "どちらを選ぶかで出力先のブロックが変わります（主＝主たる被験薬に関する届出事項）。",
  },
  変更箇所: {
    ja: "変更箇所",
    en: "Change locations",
    internal: "届出区分と提出時期を機械的に決めるための入力です。届書には出力されません。",
  },
  変更年月日: {
    ja: "変更年月日",
    en: "Change date",
    internal:
      "提出時期の起点（変更予定日）です。この欄自体は届書には出力されません" +
      "（XSDの変更年月日・変更理由は項目ごとに付くため。本デモは届単位で1組を持ちます）。",
  },
  変更理由: {
    ja: "変更理由",
    en: "Reason for change",
    internal:
      "この欄自体は届書には出力されません（XSDの変更年月日・変更理由は項目ごとに付くため。" +
      "本デモは届単位で1組を持ちます）。",
  },
  資料種別: {
    ja: "資料種別",
    en: "Document type",
    internal: "資料名の付け方をそろえるための運用区分です。届書には出力されません（資料名だけが出力されます）。",
  },
  添付状態: {
    ja: "添付状態",
    en: "Attachment status",
    internal: "PDF の栞・テキスト有無などの確認状況を持つ運用項目。届書には出力されません。",
  },
  CRC: {
    ja: "CRC",
    en: "CRC",
    internal: "施設側の連絡先を持つ運用項目。届書には出力されません。",
  },
};

/** 入力欄 → 公式様式の項目名・届書の階層（XSDから解決したもの） */
export const LABELS: Record<string, LabelEntry> = Object.fromEntries(
  Object.entries(FIELDS).map(([key, spec]) => {
    if (isSpecInternal(spec)) return [key, spec];
    const entry = xsdEntry(spec.el, spec.under);
    // XSD に無い要素名を宣言していたら、その場で分かるようにキーではなく
    // 要素名を出す（テスト officialLabels.test.ts が全件を検査して落とす）
    return [
      key,
      {
        ja: entry?.label ?? spec.el,
        en: spec.en,
        path: entry?.path ?? [spec.el],
        el: spec.el,
      } satisfies OfficialLabel,
    ];
  })
);

/** 宣言（要素名・親要素名）。テストがXSDとの整合を検査するために使う */
export const FIELD_SPECS: Record<string, { el: string; under?: string } | null> =
  Object.fromEntries(
    Object.entries(FIELDS).map(([key, spec]) => [
      key,
      isSpecInternal(spec) ? null : { el: spec.el, ...(spec.under ? { under: spec.under } : {}) },
    ])
  );

/** 親要素名の指定が必要な要素（複数箇所に現れる）かどうか */
export const needsParent = (el: string): boolean => isAmbiguous(el);

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
