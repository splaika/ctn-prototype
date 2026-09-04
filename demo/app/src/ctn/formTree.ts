// ============================================================================
// 届書ツリー（公式様式の項目構造）— PDF と XML の単一ソース
// ----------------------------------------------------------------------------
// 公式の届書出力（PMDA 届書作成支援システムの印刷）は、XML の要素ツリーを
// そのまま日本語項目名でインデント表示したものである。したがって PDF と XML を
// 別々に組み立てると必ずズレる。ここで1本のツリーを作り、
//   ・pdfForm.ts  … ツリー → A4 レイアウト
//   ・xml.ts      … ツリー → CTN XML
// の両方がこれを読む。「PDF に出ている値は必ず XML にもある」が構造的に保証される。
//
// 【重要】公式様式は値の有無にかかわらず全項目名を印字する（空欄は項目名のみ）。
// 参照出力（AMG 410 の13ページ）もそうなっている。省略してはならない。
//
// 項目名・並び・階層は参照 PDF から起こした。変更するときは実物と突き合わせること。
// ============================================================================
import {
  APPLICABILITY_OPTIONS,
  KUBUN,
  NOTIF_TYPE_VALUE,
  DRUG_ROLE,
  DOCTOR_ROLE,
  SET,
  SUBJ30_OPTIONS,
  label,
  notifTypeName,
} from "./refData";
import type {
  Compound,
  Institution,
  Irb,
  Notification,
  Site,
  Sponsor,
  StudyDrug,
} from "./types";

/** 届書ツリーの1ノード。value を持たないものは見出し（項目名のみ印字） */
export interface FormNode {
  /** 公式様式の項目名。そのまま印字される */
  label: string;
  /** 値。undefined / "" は空欄（項目名だけ印字する） */
  value?: string;
  /**
   * XML に載るときの値。届書PDF が表示名を印字する一方 XML はコード値を持つ項目
   * （届出分類・該当の有無・試験の種類など）でだけ指定する。未指定なら value と同じ。
   */
  xmlValue?: string;
  /** 対応する XML 要素名。未確定のものは undefined（XML 側で補う） */
  xml?: string;
  children?: FormNode[];
}

/** 届書の先頭（ツリーに入らない宛名部）*/
export interface FormHeader {
  noteDate: string;
  addressee: string;
  sponsorName: string;
  sponsorRepName: string;
  sponsorAddress1: string;
  sponsorAddress2: string;
}

export interface FormDocument {
  header: FormHeader;
  body: FormNode[];
}

export interface FormContext {
  compound: Compound;
  sponsor: Sponsor;
  institutions: Map<string, Institution>;
  irbs: Map<string, Irb>;
}

// ---------------------------------------------------------------------------
// 値の整形
// ---------------------------------------------------------------------------

/** 公式様式の日付は区切りなしの YYYYMMDD。データは YYYY-MM-DD で保持している */
export const ymd = (v?: string): string => (v ? v.replace(/-/g, "") : "");

const num = (v?: number | null): string => (v == null ? "" : String(v));

/** 該当の有無（0/1 → 「該当なし」「該当あり」）。未設定は空欄 */
const applic = (v?: number): string => {
  if (v == null) return "";
  return APPLICABILITY_OPTIONS.find((o) => o.value === v)?.label ?? String(v);
};

/** 選択肢のコード値をそのまま印字する項目（開発の相など） */
const code = (v?: number | string): string => (v == null || v === "" ? "" : String(v));

/**
 * 届出区分は公式様式では 1 / 2 / 3 と印字される。内部は Dataverse の選択肢コード
 * （100000200〜）なので、印字時に公式コードへ写像する。
 * ※ XML（KUBUN）は現状 内部コードをそのまま出している。公式XSDが 1/2/3 を
 *   期待するなら xml.ts 側も合わせる必要がある（要確認）。
 */
const OFFICIAL_KUBUN: Record<number, string> = {
  [KUBUN.k1]: "1",
  [KUBUN.k2]: "2",
  [KUBUN.k3]: "3",
};

const subj30 = (v?: number): string =>
  v == null ? "" : SUBJ30_OPTIONS.find((o) => o.value === v)?.label ?? String(v);

/** 見出しノード（値なし） */
const g = (label: string, children: FormNode[], xml?: string): FormNode => ({ label, children, xml });
/** 値ノード */
const f = (label: string, value?: string, xml?: string): FormNode => ({ label, value, xml });
/** 表示は名称・XML はコード値、という項目（届出分類・該当の有無・区分など） */
const fc = (label: string, display: string, codeValue?: string | number, xml?: string): FormNode => ({
  label,
  value: display,
  xmlValue: codeValue == null ? "" : String(codeValue),
  xml,
});

// ---------------------------------------------------------------------------
// 部品ビルダ
// ---------------------------------------------------------------------------

/** 剤形コード情報 / 投与経路コード情報（順序番号＋コードの繰り返し枠） */
const codeGroup = (heading: string, itemLabel: string, value: string | undefined, xml: string): FormNode =>
  g(heading, [f("順序番号", value ? "1" : ""), f(itemLabel, value, xml)]);

/** 海外依頼者、外国製造業者に関する情報（邦文4＋外国文4）。主たる被験薬・その他で共通 */
const foreignGroup = (src: {
  foreignName?: string;
  foreignRepName?: string;
  foreignAddress1?: string;
  foreignAddress2?: string;
  foreignNameFrgn?: string;
  foreignRepNameFrgn?: string;
  foreignAddress1Frgn?: string;
  foreignAddress2Frgn?: string;
}, prefix = ""): FormNode =>
  g("海外依頼者、外国製造業者に関する情報", [
    f("順序番号", src.foreignName || src.foreignNameFrgn ? "1" : ""),
    f("海外依頼者、外国製造業者の名称（邦文）", src.foreignName, `${prefix}FOREIGN_SPONSOR_NAME`),
    f("海外依頼者、外国製造業者の(代表者の)氏名（邦文）", src.foreignRepName, `${prefix}FOREIGN_SPONSOR_REP_NAME`),
    f("所在地１（邦文）", src.foreignAddress1, `${prefix}FOREIGN_SPONSOR_ADDRESS1`),
    f("所在地２（邦文）", src.foreignAddress2, `${prefix}FOREIGN_SPONSOR_ADDRESS2`),
    f("海外依頼者、外国製造業者の名称（外国文）", src.foreignNameFrgn, `${prefix}FOREIGN_NAME_FRGNLNG`),
    f("海外依頼者、外国製造業者の(代表者の)氏名（外国文）", src.foreignRepNameFrgn, `${prefix}FOREIGN_SPOMSPR_REP_NAME_FRGNLNG`),
    f("所在地１（外国文）", src.foreignAddress1Frgn, `${prefix}FOREIGN_ADDRESS1_FRGNLNG`),
    f("所在地２（外国文）", src.foreignAddress2Frgn, `${prefix}FOREIGN_ADDRESS2_FRGNLNG`),
  ]);

/** その他の情報（該当性4種＋その他）。主たる被験薬・その他治験使用薬で同じ形 */
const applicNode = (label: string, v: number | undefined, xml: string): FormNode =>
  fc(label, applic(v), v, xml);

const otherInfoGroup = (v: {
  cartagena?: number;
  cartagenaDetail?: string;
  biological?: number;
  codx?: number;
  combinationProd?: number;
  other?: string;
}, prefix = ""): FormNode =>
  g("その他の情報", [
    g("カルタヘナ法の対象となる薬物を用いる治験", [
      applicNode("該当の有無等", v.cartagena, `${prefix}TYPECLINTRIALWITHDRUGCARTAGENA`),
      f("該当する場合の詳述", v.cartagenaDetail),
    ]),
    g("生物由来製品に指定が見込まれる薬物を用いる治験", [
      applicNode("該当の有無等", v.biological, `${prefix}TYPEBIOLOGICALPROD`),
    ]),
    g("対応するコンパニオン診断薬等の開発", [
      applicNode("該当の有無", v.codx, `${prefix}INFORESEARCHFORCODX_APPLICABLEORNOT`),
    ]),
    g("コンビネーション製品に関する治験", [
      applicNode("該当の有無", v.combinationProd, `${prefix}INFOCLINTRIALFORCOMBINATIONPROD_APPLICABLEORNOT`),
    ]),
    f("その他", v.other),
  ]);

// ---------------------------------------------------------------------------
// 主たる被験薬に関する届出事項
// ---------------------------------------------------------------------------

function mainDrugSection(n: Notification, ctx: FormContext, main?: StudyDrug): FormNode {
  return g("主たる被験薬に関する届出事項", [
    f("届出年月日", ymd(n.noteDate), "NOTEDATE"),
    fc("届出分類", notifTypeName(n.notifType, "ja"), NOTIF_TYPE_VALUE[n.notifType], "NOTIFTYPE"),
    f("変更回数", num(n.changeCount), "CHANGECOUNT"),
    fc("届出区分", n.kubun != null ? OFFICIAL_KUBUN[n.kubun] ?? String(n.kubun) : "", n.kubun, "KUBUN"),
    fc("主たる被験薬の30 日調査対応被験薬区分", subj30(n.subj30dayReview), n.subj30dayReview, "CATEGTESTPRODUCTSUBJ30DAYREVIEW"),

    g("中止情報", [
      f("中止日年月日", ymd(n.terminationDate), "TERMINATIONDATE"),
      f("中止理由", n.terminationReason, "TERMINATIONREASON"),
      f("その後の対応状況", n.postTermination, "POSTTERMINATION"),
    ], "INFOTERMINATION"),

    g("主たる被験薬の製造所又は営業所（治験薬提供者）の名称及び所在地", [
      f("順序番号", main ? "1" : ""),
      f("名称", main?.plantName, "PLANTNAME"),
      f("所在地１", main?.plantAddress1, "PLANTADDRESS1"),
      f("所在地２", main?.plantAddress2, "PLANTADDRESS2"),
      f("業者コード", main?.plantCode, "PLANTCODE"),
    ]),

    g("主たる被験薬の成分及び分量情報", [
      f("成分及び分量", main?.ingredients, "INGREDIENTS"),
      codeGroup("剤形コード情報", "剤形コード", main?.dosageFormCode, "DOSAGEFORMCODE"),
    ]),

    f("主たる被験薬の製造方法", main?.manufactMethod, "MANUFACTMETHOD"),

    g("主たる被験薬の予定される効能又は効果情報", [
      f("予定される効能又は効果", main?.intendEffects, "INTENDEFFECTS"),
      f("薬効分類番号", main?.efficacyClassCode, "EFFICACYCLASSCODE"),
    ]),

    g("主たる被験薬の予定される用法及び用量情報", [
      f("予定される用法及び用量", main?.intendDosage, "INTENDDOSAGE"),
      codeGroup("投与経路コード情報", "投与経路コード", main?.adminRouteCode, "ADMINROUTECODE"),
    ]),

    g("治験計画の概要", [
      f("実施計画書識別記号", n.protocolNo, "PROTOCOLNO"),
      f("開発の相", code(n.phase), "PHASE"),
      fc("試験の種類", n.trialType != null ? label(SET.trialType, n.trialType) : "", n.trialType, "TRIALTYPE"),
      f("目的", n.objectives, "OBJECTIVES"),
      g("予定被験者数情報", [
        f("予定被験者数（被験薬）", num(n.plannedSubjDrug), "PLANNEDSUBJDRUG"),
        f("予定被験者数（合計）", num(n.plannedSubjTotal), "PLANNEDSUBJTOTAL"),
      ]),
      f("主たる被験薬の対象疾患", n.targetDisease, "TARGETDISEASE"),
      g("主たる被験薬の用法及び用量情報", [
        f("用法及び用量", main?.dosageAdmin, "DOSAGEADMIN"),
        codeGroup("投与経路コード情報", "投与経路コード", main?.adminRouteCode, "ADMINROUTECODE"),
      ]),
      g("実施期間", [
        f("開始日年月日", ymd(n.periodStart), "PERIODSTART"),
        f("終了日年月日", ymd(n.periodEnd), "PERIODEND"),
      ]),
      f("有償の理由等", n.reasonOnerous, "REASONONEROUS"),
      g("治験の費用負担者に関する情報", [
        f("順序番号", n.chargeOutPersonName ? "1" : ""),
        f("費用負担者氏名", n.chargeOutPersonName, "CHARGEOUTPERSONNAME"),
        f("妥当性", n.validityReasons, "VALIDITYREASONS"),
      ], "CHARGEOUTPERSONCLINTRIAL"),
      g("治験調整医師又は治験調整委員会構成医師に関する情報", [
        f("順序番号", n.coordName ? "1" : ""),
        f("治験調整医師の氏名", n.coordName, "KEYINVEST_NAME"),
        f("治験調整医師の所属機関", n.coordInstitution, "NAMEMEDICALINSTITUT"),
        f("治験調整医師の所属", n.coordAffiliation, "KEYINVEST_AFFILIATION"),
      ], "INFOCOORDINVESTIGATOR"),
      g("治験の依頼（準備）及び管理に関する業務の全部又は一部を受託する者（開発業務受託機関（ＣＲＯ））の氏名、住所及び委託する業務の範囲", [
        f("順序番号", n.croName ? "1" : ""),
        f("氏名", n.croName, "CRO_NAME"),
        f("住所１", n.croAddress1, "CRO_ADDRESS1"),
        f("住所２", n.croAddress2, "CRO_ADDRESS2"),
        f("委託する業務の範囲", n.croService, "CRO_SERVICE"),
      ], "INFOCRO"),
    ]),

    {
      ...otherInfoGroup({
        cartagena: n.applicCartagena,
        cartagenaDetail: n.applicCartagenaDetail,
        biological: n.applicBiological,
        codx: n.applicCodx,
        combinationProd: n.applicCombinationProd,
        other: n.otherCommentsPrimary,
      }),
      label: "主たる被験薬のその他の情報",
    },

    g("当該届出に関するその他の情報", [
      g("臨床試験の位置付け", [
        applicNode("該当の有無等", n.applicExpandedAccess, "TYPEEXPANDEDACCESSPROG"),
      ]),
      g("国際共同治験", [
        applicNode("該当の有無", n.isGlobal ? 1 : 0, "INFOGLOBALCLINTRIAL_APPLICABLEORNOT"),
        f("内容", n.globalContents, "INFOGLOBALCLINTRIAL_CONTENTS"),
      ]),
      g("ゲノム検査等を含む治験", [
        applicNode("該当の有無等", n.applicGeneTest, "INFOCLINTRIALINCLUDINGGENETEST_APPLICABLEORNOT"),
      ]),
      g("マイクロドーズ臨床試験を利用した開発品目", [
        applicNode("該当の有無等", n.applicMicrodose, "INFOPRODUSINGMDCLINTRIAL_APPLICABLEORNOT"),
      ]),
      g("当該届出に関する治験に併用する機械器具等の記載", [
        applicNode("該当の有無", n.applicCombEquipment, "INFOCOMBEQUIPMENT_APPLICABLEORNOT"),
        f("順序番号", n.combEquipmentContents ? "1" : ""),
        f("内容", n.combEquipmentContents, "INFOCOMBEQUIPMENT_CONTENTS"),
      ]),
      f("その他", n.otherCommentsProtocol, "OTHERCOMMENTS_PROTOCOL"),
    ]),

    g("備考", [
      f("順序番号", n.remarks ? "1" : ""),
      f("内容", n.remarks, "REMARKS"),
    ]),

    g("届書添付資料", [
      ...(n.attachments.length
        ? n.attachments.map((a, i) =>
            g("資料名情報", [f("順序番号", String(i + 1)), f("資料名", a.docName, "NAMEDOC")], "INFONAMEDOCUMENTS")
          )
        : [g("資料名情報", [f("順序番号"), f("資料名")], "INFONAMEDOCUMENTS")]),
      f("備考"),
    ], "DOCATTACHEDNOTE"),

    g("治験届出者に関する情報", [
      f("順序番号", "1"),
      f("治験届出者の種別", ctx.sponsor.sponsorType, "SPONSORTYPE"),
      f("届出者の名称", ctx.sponsor.name, "SPONSORNAME"),
      f("届出者の（代表者の）氏名", ctx.sponsor.repName, "REPNAME"),
      f("所在地１", ctx.sponsor.address1, "ADDRESS1"),
      f("所在地２", ctx.sponsor.address2, "ADDRESS2"),
      f("業者コード", ctx.sponsor.manufacturerCode, "MANUFACTURERCODE"),
      g("届出担当者の情報", [
        f("担当者の氏名", ctx.sponsor.contactName, "CONTACTNAME"),
        f("担当者の所属", ctx.sponsor.contactTitle, "CONTACTAFFILIATION"),
        f("電話番号", ctx.sponsor.telNo, "TELNO"),
        f("ＦＡＸ番号又はメールアドレス", ctx.sponsor.faxOrMail, "FAXORMAIL"),
      ]),
    ], "INFOPERSONFILLNOTE"),

    foreignGroup(n),
  ]);
}

// ---------------------------------------------------------------------------
// その他治験使用薬（主たる被験薬を除く）
// ---------------------------------------------------------------------------

const OTHER_DRUG_HEADING =
  "治験使用薬、治験使用機器相当、治験使用製品相当（主たる被験薬を除く。）の情報";

function otherDrugNodes(d: StudyDrug, index: number): FormNode[] {
  return [
    f("順序番号", String(d.serialNo || index + 1)),
    f("医薬品／医療機器／再生医療等製品の別", code(d.productCategory), "COMB_PRODUCTCATEGORY"),
    g("治験使用薬、治験使用機器相当、治験使用製品相当の記号・名称等", [
      f("記号・名称等", d.drugName, "COMBINATION_ID"),
      f("記号・名称等の種類", d.idType, "TYPECOMBINATION_ID"),
      f("その他の場合の詳述", d.idTypeDetail, "DETAIL"),
    ]),
    g("治験使用薬、治験使用機器相当、治験使用製品相当区分情報", [
      f("被験薬／対照薬／併用薬／レスキュー薬などの区別", code(d.combCategory), "COMBINATIONCATEGORY"),
      f("その他の場合の治験使用薬、治験使用機器相当、治験使用製品相当の別", d.combCategoryOther, "OTHERCOMBINATIONCATEGORY"),
    ]),
    f("国内における承認状況", d.applicationStatus, "COMB_APPLICATIONSTATUS"),
    g("治験使用薬、治験使用機器相当、治験使用製品相当（主たる被験薬を除く。）の届出事項", [
      fc("30 日調査対応被験薬区分", subj30(d.drugSubj30dayReview), d.drugSubj30dayReview, "COMB_CATEGTESTPRODUCTSUBJ30DAYREVIEW"),
      f("製造所又は営業所（治験薬提供者）の名称及び所在地", d.plantName, "PLANTNAME"),
      g("成分及び分量情報", [
        f("成分及び分量", d.ingredients, "INGREDIENTS"),
        codeGroup("剤形コード情報", "剤形コード", d.dosageFormCode, "DOSAGEFORMCODE"),
      ]),
      f("製造方法", d.manufactMethod, "MANUFACTMETHOD"),
      g("予定される効能又は効果情報", [
        f("予定される効能又は効果", d.intendEffects, "INTENDEFFECTS"),
        f("薬効分類番号", d.efficacyClassCode, "EFFICACYCLASSCODE"),
      ]),
      g("予定される用法及び用量情報", [
        f("予定される用法及び用量", d.intendDosage, "INTENDDOSAGE"),
        codeGroup("投与経路コード情報", "投与経路コード", d.adminRouteCode, "ADMINROUTECODE"),
      ]),
      g("治験計画の概要", [
        f("対象疾患", d.drugTargetDisease, "COMB_TARGETDISEASE"),
        g("用法及び用量情報", [
          f("用法及び用量", d.dosageAdmin, "DOSAGEADMIN"),
          codeGroup("投与経路コード情報", "投与経路コード", d.adminRouteCode, "ADMINROUTECODE"),
        ]),
      ]),
      otherInfoGroup({
        cartagena: d.drugApplicCartagena,
        biological: d.drugApplicBiological,
        codx: d.drugApplicCodx,
        combinationProd: d.drugApplicCombinationProd,
      }, "COMB_"),
      foreignGroup(d, "COMB_"),
      f("その他備考", d.drugRemarks, "COMB_REMARKS"),
      f("副作用報告の有無", d.adrReport, "COMB_PRESENCEADRREPORT"),
    ]),
  ];
}

// ---------------------------------------------------------------------------
// 実施医療機関情報
// ---------------------------------------------------------------------------

function siteNodes(s: Site, n: Notification, ctx: FormContext, index: number): FormNode[] {
  const inst = ctx.institutions.get(s.institutionId);
  const irb = ctx.irbs.get(s.irbId);
  const chiefs = s.investigators.filter((iv) => iv.doctorRole === DOCTOR_ROLE.responsible);
  const subs = s.investigators.filter((iv) => iv.doctorRole !== DOCTOR_ROLE.responsible);

  const chiefNodes: FormNode[] = chiefs.length
    ? chiefs.flatMap((iv, i) => [
        f("順序番号", String(iv.serialNo || i + 1)),
        f("治験責任医師の氏名", iv.nameFiling, "NAMEFILING"),
        f("大学番号", iv.medSchoolNo, "MEDSCHOOLNO"),
        f("卒業年", iv.graduationYear, "GRADUATIONYEAR"),
        f("氏名よみかな", iv.pronounce, "PRONOUNCE"),
      ])
    : [f("順序番号"), f("治験責任医師の氏名"), f("大学番号"), f("卒業年"), f("氏名よみかな")];

  const subNodes: FormNode[] = subs.length
    ? subs.flatMap((iv, i) => [
        f("順序番号", String(iv.serialNo || i + 1)),
        f("治験分担医師の氏名", iv.nameFiling, "NAMEFILING"),
        f("氏名よみかな", iv.pronounce, "PRONOUNCE"),
      ])
    : [f("順序番号"), f("治験分担医師の氏名"), f("氏名よみかな")];

  const qtyNodes: FormNode[] = s.quantities.length
    ? s.quantities.flatMap((q, i) => {
        const drug = n.studyDrugs.find((d) => d.id === q.studyDrugId);
        return [
          f("順序番号", String(q.serialNo || i + 1)),
          f("治験使用薬、治験使用機器相当、治験使用製品相当の名称", drug?.drugName, "DRUGNAME"),
          f("予定交付（入手）数量", q.qtyNotation || num(q.qtyPlanned), "QTYPLANNED"),
          f("交付数量", num(q.qtySupplied), "QTYSUPPLIED"),
          f("使用数量", num(q.qtyUsed), "QTYUSED"),
          f("回収数量", num(q.qtyWithdrawn), "QTYWITHDRAWN"),
          f("廃棄数量", num(q.qtyAbrogated), "QTYABROGATED"),
        ];
      })
    : [
        f("順序番号"),
        f("治験使用薬、治験使用機器相当、治験使用製品相当の名称"),
        f("予定交付（入手）数量"),
        f("交付数量"),
        f("使用数量"),
        f("回収数量"),
        f("廃棄数量"),
      ];

  return [
    f("順序番号", String(s.serialNo || index + 1)),
    f("実施医療機関の名称", inst?.name, "INSTITUTENAME"),
    f("実施診療科", s.department, "DEPARTMENT"),
    f("所在地１", inst?.address1, "ADDRESS1"),
    f("所在地２", inst?.address2, "ADDRESS2"),
    f("電話番号", inst?.telNo, "TELNO"),
    g("治験責任医師に関する情報", chiefNodes, "INFOINVESTIGATOR"),
    g("治験分担医師に関する情報", subNodes, "INFOSUBINVESTIGATOR"),
    g("治験使用薬、治験使用機器相当、治験使用製品相当の数量情報", qtyNodes, "INFOQUANTITIESINVESTPRODUCT"),
    f("実施医療機関予定被験者数", num(s.plannedSubjects), "PLANNEDSUBJECTS"),
    f("実施医療機関被験者数", num(s.enrolledSubjects), "ENROLLEDSUBJECTS"),
    g("治験の実施に関する業務の一部を実施医療機関から受託する者（治験施設支援機関（ＳＭＯ）等）の氏名、住所及び委託する業務の範囲", [
      f("氏名", s.smoName, "SMO_NAME"),
      f("住所１", s.smoAddress1, "SMO_ADDRESS1"),
      f("住所２", s.smoAddress2, "SMO_ADDRESS2"),
      f("委託する業務の範囲", s.smoService, "SMO_SERVICE"),
    ]),
    g("治験審査委員会に関する情報", [
      fc("院内・外部の区分", irb ? label(SET.irbType, irb.irbType) : "", irb?.irbType, "IRBTYPE"),
      f("治験審査委員会の設置者の名称", irb?.ownerName, "OWNERNAME"),
      f("所在地１", irb?.address1, "ADDRESS1"),
      f("所在地２", irb?.address2, "ADDRESS2"),
    ], "INFOIRB"),
    f("その他", s.others),
  ];
}

// ---------------------------------------------------------------------------
// 組み立て
// ---------------------------------------------------------------------------

export function buildFormDocument(n: Notification, ctx: FormContext): FormDocument {
  const main = n.studyDrugs.find((d) => d.drugRole === DRUG_ROLE.main);
  const others = n.studyDrugs.filter((d) => d.drugRole === DRUG_ROLE.other);

  const body: FormNode[] = [
    f("治験の計画等の届出"),
    f("様式等のバージョン情報", n.formVersion ?? "医薬品治験届 令和２年８月改正版", "INFOFORMVERSION"),

    g("治験届出共通事項", [
      f("主たる被験薬の治験成分記号", ctx.compound.compoundCode, "COMPOUNDCODE"),
      f("治験の種類", ctx.compound.trialKind, "TRIALKIND"),
      f("主たる被験薬の初回届出受付番号", ctx.compound.initReceptNo, "INITRECEPTNO"),
      f("主たる被験薬の初回届出年月日", ymd(ctx.compound.initNoteDate), "INITNOTEDATE"),
      f("主たる被験薬の届出回数", n.notifType === "devDiscontinuation" ? "00" : num(n.filingCount), "FILINGCOUNT"),
      f("当該治験計画届出受付番号", n.receptNo, "RECEPTNO"),
      f("当該治験計画届出年月日", ymd(n.receptDate ?? n.noteDate), "RECEPTDATE"),
    ]),

    mainDrugSection(n, ctx, main),

    // 公式様式では、その他治験使用薬が0件でも見出しと項目枠が印字される
    g(OTHER_DRUG_HEADING, others.length
      ? others.flatMap((d, i) => otherDrugNodes(d, i))
      : otherDrugNodes({} as StudyDrug, 0)),

    g("実施医療機関情報", [
      g("実施医療機関ごとの事項", n.sites.length
        ? n.sites.flatMap((s, i) => siteNodes(s, n, ctx, i))
        : siteNodes({ investigators: [], quantities: [] } as unknown as Site, n, ctx, 0),
        "INFOEACHMEDICALINSTITUT"),
      f("脚注", n.footnote, "FOOTNOTE"),
    ]),

    g("参照する治験届出情報", n.references.length
      ? n.references.flatMap((r, i) => [
          f("順序番号", String(r.serialNo || i + 1)),
          f("医薬品／医療機器／再生医療等製品の別", r.refCategory),
          f("治験成分記号又は治験識別記号", r.refCode),
          f("届出回数", r.refCount),
          f("参照の区分", r.refType),
          f("参照の詳細", r.refContents),
        ])
      : [
          f("順序番号"),
          f("医薬品／医療機器／再生医療等製品の別"),
          f("治験成分記号又は治験識別記号"),
          f("届出回数"),
          f("参照の区分"),
          f("参照の詳細"),
        ], "INFOREFERENCENOTE"),
  ];

  return {
    header: {
      noteDate: ymd(n.noteDate),
      addressee: "独立行政法人医薬品医療機器総合機構理事長　殿",
      sponsorName: ctx.sponsor.name,
      sponsorRepName: ctx.sponsor.repName,
      sponsorAddress1: ctx.sponsor.address1,
      sponsorAddress2: ctx.sponsor.address2,
    },
    body,
  };
}

/** ツリーを深さ優先で走査する（XML 生成・検証で使う） */
export function walkForm(nodes: FormNode[], visit: (node: FormNode, depth: number) => void, depth = 0): void {
  for (const node of nodes) {
    visit(node, depth);
    if (node.children) walkForm(node.children, visit, depth + 1);
  }
}
