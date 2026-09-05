// ============================================================================
// formValues.ts — 公式XSDの要素名から値を解決する
// ----------------------------------------------------------------------------
// 届書の構造・項目名・出現順は xsdForm.generated.ts（＝厚生労働省のXSD）が正。
// このファイルの責務は「その要素に何の値を入れるか」だけを持つこと。
//
// この分離をした理由:
//   以前は届書ツリーを手で組んでいたため、項目名も要素名も公式とずれた
//   （XML要素名の一致は40%だった）。構造をXSDから読み、値だけをここで
//   与える形にすると、ラベル・要素名・出現順は構造的に一致する。
//
// 繰り返し行（実施医療機関ごとの事項・その他治験使用薬・分担医師など）は
// rowsFor が行スコープを返し、valueOf はその行のスコープから値を引く。
// ============================================================================
import {
  APPLICABILITY_OPTIONS,
  BIOLOGICAL_OPTIONS,
  CARTAGENA_OPTIONS,
  DOCTOR_ROLE,
  DRUG_ROLE,
  KUBUN,
  NOTIF_TYPE_VALUE,
  OFFICIAL_PHASE,
  SET,
  SUBJ30_OPTIONS,
  TRIAL_POSITION_OPTIONS,
  label,
  notifTypeName,
} from "./refData";
import type {
  Attachment,
  Compound,
  Institution,
  Investigator,
  Irb,
  Notification,
  ReferenceNote,
  Site,
  SiteDrugQty,
  Sponsor,
  StudyDrug,
} from "./types";

export interface FormContext {
  compound: Compound;
  sponsor: Sponsor;
  institutions: Map<string, Institution>;
  irbs: Map<string, Irb>;
}

/** 繰り返し行のどこを見ているか。valueOf はここから値を引く */
export interface RowScope {
  n: Notification;
  ctx: FormContext;
  /** その他治験使用薬（主たる被験薬を除く）の行 */
  drug?: StudyDrug;
  /** 実施医療機関ごとの事項の行 */
  site?: Site;
  /** 治験責任医師／治験分担医師の行 */
  inv?: Investigator;
  /** 数量情報の行 */
  qty?: SiteDrugQty;
  /** 資料名情報の行 */
  attachment?: Attachment;
  /** 参照する治験届出情報の行 */
  reference?: ReferenceNote;
  /** SERIALNO1 / SERIALNO2 に出す順序番号 */
  serial1?: number;
  serial2?: number;
}

// ---------------------------------------------------------------------------
// 値の整形
// ---------------------------------------------------------------------------

/** 公式様式の日付は区切りなしの YYYYMMDD。データは YYYY-MM-DD で持っている */
export const ymd = (v?: string): string => (v ? v.replace(/-/g, "") : "");

const num = (v?: number | null): string => (v == null ? "" : String(v));
const txt = (v?: string | null): string => v ?? "";

/** 表示は名称・XMLはコード値、という項目のための組 */
export interface Resolved {
  /** 画面と届書PDFに出す文字列 */
  display: string;
  /** XML に入れる値。省略時は display と同じ */
  xmlValue?: string;
}

const plain = (v: string): Resolved => ({ display: v });
const coded = (display: string, codeValue?: string | number): Resolved => ({
  display,
  xmlValue: codeValue == null ? "" : String(codeValue),
});

/**
 * 選択肢セットから届書に出す文字列を引く。
 * 届書には選んだ文字列がそのまま印字される（参照出力 AMG 410 も「該当あり」
 * 「該当なし」「新有効成分」のような文字列）。未設定は空欄。
 */
const fromOptions = (
  opts: readonly { value: number; label: string }[],
  v?: number
): Resolved => (v == null ? plain("") : coded(opts.find((o) => o.value === v)?.label ?? String(v), v));

/** 該当の有無（該当あり／該当なし）。手引き 5.2(13)3）4）・(14)2）〜5） */
const applic = (v?: number): Resolved => fromOptions(APPLICABILITY_OPTIONS, v);

/** 30日調査対応被験薬区分（新有効成分／新投与経路／新医療用配合剤）。手引き 5.2(5) */
const subj30 = (v?: number): Resolved => fromOptions(SUBJ30_OPTIONS, v);

/**
 * 届出区分は公式様式では 1 / 2 / 3 と印字される。内部は Dataverse の選択肢
 * コード（100000200〜）なので印字時に公式コードへ写像する。
 */
const OFFICIAL_KUBUN: Record<number, string> = {
  [KUBUN.k1]: "1",
  [KUBUN.k2]: "2",
  [KUBUN.k3]: "3",
};

// ---------------------------------------------------------------------------
// 繰り返し行の展開
// ---------------------------------------------------------------------------

/**
 * 繰り返し枠に対して行スコープの列を返す。
 *
 * データが無くても**必ず1行返す**。公式様式は値が無くても項目名を印字する
 * ため（参照出力の13ページもそうなっている）、行を0件にすると届書から
 * 項目が消えてしまう。
 */
export function rowsFor(el: string, scope: RowScope): RowScope[] {
  const { n, ctx } = scope;
  const one = (extra: Partial<RowScope>): RowScope[] => [{ ...scope, serial1: 1, ...extra }];

  switch (el) {
    // ---- 主たる被験薬に関する届出事項 ----
    case "INFONAMEADDRESSMANUFACTPLANT":
    case "INFODOSAGEFORMCODE":
    case "INFOADMINROUTECODE":
      return one({});
    case "CHARGEOUTPERSONCLINTRIAL":
      return one({});
    case "INFOCOORDINVESTIGATOR":
      return one({});
    case "INFOCRO":
      return one({});
    case "REMARKS":
      return one({});
    case "INFOPERSONFILLNOTE":
      return one({});
    case "INFOFOREIGNMANUFACTURER":
      return one({});

    // ---- 届書添付資料 ----
    case "INFONAMEDOCUMENTS":
      return n.attachments.length
        ? n.attachments.map((a, i) => ({ ...scope, attachment: a, serial1: i + 1 }))
        : one({});

    // ---- その他治験使用薬 ----
    case "INFOCOMBINATION": {
      const others = n.studyDrugs.filter((d) => d.drugRole === DRUG_ROLE.other);
      return others.length
        ? others.map((d, i) => ({ ...scope, drug: d, serial1: d.serialNo || i + 1 }))
        : one({});
    }
    case "COMB_INFONAMEADDRESSMANUFACTPLANT":
    case "COMB_INFODOSAGEFORMCODE":
    case "COMB_INFOADMINROUTECODE":
    case "COMB_INFOFOREIGNMANUFACTURER":
      return [{ ...scope, serial2: 1 }];

    // ---- 実施医療機関情報 ----
    case "INFOEACHMEDICALINSTITUT":
      return n.sites.length
        ? n.sites.map((s, i) => ({ ...scope, site: s, serial1: s.serialNo || i + 1 }))
        : one({});
    case "INFOINVESTIGATOR": {
      const chiefs = (scope.site?.investigators ?? []).filter((iv) => iv.doctorRole === DOCTOR_ROLE.responsible);
      return chiefs.length
        ? chiefs.map((iv, i) => ({ ...scope, inv: iv, serial2: iv.serialNo || i + 1 }))
        : [{ ...scope, serial2: 1 }];
    }
    case "INFOSUBINVESTIGATOR": {
      const subs = (scope.site?.investigators ?? []).filter((iv) => iv.doctorRole !== DOCTOR_ROLE.responsible);
      return subs.length
        ? subs.map((iv, i) => ({ ...scope, inv: iv, serial2: iv.serialNo || i + 1 }))
        : [{ ...scope, serial2: 1 }];
    }
    case "INFOQUANTITIESINVESTPRODUCT": {
      const qs = scope.site?.quantities ?? [];
      return qs.length
        ? qs.map((q, i) => ({ ...scope, qty: q, serial2: q.serialNo || i + 1 }))
        : [{ ...scope, serial2: 1 }];
    }
    case "INFOSMOINMEDINST":
    case "INFOIRB":
      return [{ ...scope, serial2: 1 }];

    // ---- 参照する治験届出情報 ----
    case "INFOREFCLINTRIALPLANNOTER":
      return n.references.length
        ? n.references.map((r, i) => ({ ...scope, reference: r, serial1: r.serialNo || i + 1 }))
        : one({});

    default:
      // 未知の繰り返し枠は1行。XSD が増えたときに項目が消えないようにする
      return one({});
  }
}

// ---------------------------------------------------------------------------
// 値の解決
// ---------------------------------------------------------------------------

/**
 * 要素名から値を引く。undefined を返した要素は「アプリが値を持たない項目」で、
 * 届書には項目名だけが出る（公式様式の空欄と同じ扱い）。
 */
export function valueOf(el: string, s: RowScope): Resolved | undefined {
  const { n, ctx } = s;
  const main = n.studyDrugs.find((d) => d.drugRole === DRUG_ROLE.main);
  const d = s.drug;
  const site = s.site;
  const inst = site ? ctx.institutions.get(site.institutionId) : undefined;
  const irb = site ? ctx.irbs.get(site.irbId) : undefined;

  switch (el) {
    // ---- 順序番号 ----
    case "SERIALNO1":
      return plain(num(s.serial1));
    case "SERIALNO2":
      return plain(num(s.serial2));

    // ---- 様式・共通事項 ----
    case "INFOFORMVERSION":
      return plain(n.formVersion ?? "医薬品治験届 令和２年８月改正版");
    case "TESTSUBSTANCEIDCODE":
      return plain(txt(ctx.compound.compoundCode));
    case "TYPECLINTRIALS":
      return plain(txt(ctx.compound.trialKind));
    case "RECEPTNUMINITNOTE":
      return plain(txt(ctx.compound.initReceptNo));
    case "INITNOTEDATE":
      return plain(ymd(ctx.compound.initNoteDate));
    case "SERIALNOTENUM":
      return plain(n.notifType === "devDiscontinuation" ? "00" : num(n.filingCount));
    case "RECEPTNUMCLINTRIALPLANNOTE":
      return plain(txt(n.receptNo));
    case "CLINTRIALPLANNOTEDATE":
      return plain(ymd(n.receptDate ?? n.noteDate));

    // ---- 主たる被験薬に関する届出事項 ----
    case "NOTEDATE":
      return plain(ymd(n.noteDate));
    case "CLASSNOTE":
      return coded(notifTypeName(n.notifType, "ja"), NOTIF_TYPE_VALUE[n.notifType]);
    case "TIMESCHANGE":
      return plain(num(n.changeCount));
    case "CATEGORYNOTE":
      return n.kubun == null
        ? plain("")
        : coded(OFFICIAL_KUBUN[n.kubun] ?? String(n.kubun), n.kubun);
    case "CATEGTESTPRODUCTSUBJ30DAYREVIEW":
      return subj30(n.subj30dayReview);

    // 中止情報
    case "TERMINATIONDATE":
      return plain(ymd(n.terminationDate));
    case "REASONTERMINATION":
      return plain(txt(n.terminationReason));
    case "POSTTERMINATIONMEASURE":
      return plain(txt(n.postTermination));

    // 製造所又は営業所
    case "SPONSOR_NAME":
      return plain(txt(main?.plantName));
    case "SPONSOR_ADDRESS1":
      return plain(txt(main?.plantAddress1));
    case "SPONSOR_ADDRESS2":
      return plain(txt(main?.plantAddress2));
    case "MANUFACTURERIMPORTERCODE":
      // 主たる被験薬の製造所と治験届出者の両方で使われる要素名。行スコープで分ける
      return plain(s.serial1 != null && !site ? txt(main?.plantCode) : txt(ctx.sponsor.manufacturerCode));

    // 成分及び分量／剤形
    case "INGREDIENTSQUANTITIES":
      return plain(txt(main?.ingredients));
    case "DOSAGEFORMCODE":
      return plain(txt(main?.dosageFormCode));
    case "MANUFACTMETHOD":
      return plain(txt(main?.manufactMethod));

    // 効能効果／用法用量
    case "INTENDINDICATIONSEFFECTS":
      return plain(txt(main?.intendEffects));
    case "EFFICACYCLASSCODENUMBER":
      return plain(txt(main?.efficacyClassCode));
    case "INTENDDOSAGEADMIN":
      return plain(txt(main?.intendDosage));
    case "ADMINROUTECODE":
      return plain(txt(main?.adminRouteCode));

    // 治験計画の概要
    case "PROTOCOLNUM":
      return plain(txt(n.protocolNo));
    // 届書に出るのは開発相コード（半角数字1桁）。画面は「第I相」等で選ぶが、
            // 印字は "1" になる（手引き 5.2(12)2）・参照出力 AMG 410 も "1"）
    case "PHASECLINTRIAL":
      return n.phase == null ? plain("") : coded(OFFICIAL_PHASE[n.phase] ?? "", n.phase);
    case "TYPECLINTRIAL":
      return n.trialType == null ? plain("") : coded(label(SET.trialType, n.trialType), n.trialType);
    case "TRIALOBJECTIVES":
      return plain(txt(n.objectives));
    case "PLANNUMSUBJTESTPRODUCT":
      return plain(num(n.plannedSubjDrug));
    case "PLANNUMSUBJECTSTOTAL":
      return plain(num(n.plannedSubjTotal));
    case "TARGETDISEASE":
      return plain(txt(n.targetDisease));
    case "DOSAGEADMIN":
      return plain(txt(main?.dosageAdmin));
    case "STARTDATECLINTRIAL":
      return plain(ymd(n.periodStart));
    case "ENDDATECLINTRIAL":
      return plain(ymd(n.periodEnd));
    case "REASONONEROUS":
      return plain(txt(n.reasonOnerous));
    case "CHARGEOUTPERSONNAME":
      return plain(txt(n.chargeOutPersonName));
    case "VALIDITYREASONS":
      return plain(txt(n.validityReasons));
    case "KEYINVEST_NAME":
      return plain(txt(n.coordName));
    case "NAMEMEDICALINSTITUT":
      return plain(txt(n.coordInstitution));
    case "KEYINVEST_AFFILIATION":
      return plain(txt(n.coordAffiliation));
    case "CRO_NAME":
      return plain(txt(n.croName));
    case "CRO_ADDRESS1":
      return plain(txt(n.croAddress1));
    case "CRO_ADDRESS2":
      return plain(txt(n.croAddress2));
    case "CRO_SERVICE":
      return plain(txt(n.croService));

    // 主たる被験薬のその他の情報
    // 「該当の有無等」は単なる有無ではなく、手引きが指定する区分を入力する
    case "TYPECLINTRIALWITHDRUGCARTAGENA":
      return fromOptions(CARTAGENA_OPTIONS, d ? d.drugApplicCartagena : n.applicCartagena);
    case "TYPEBIOLOGICALPROD":
      return fromOptions(BIOLOGICAL_OPTIONS, d ? d.drugApplicBiological : n.applicBiological);
    case "OTHERCOMMENTS_PRIMARY":
      return plain(txt(n.otherCommentsPrimary));

    // 当該届出に関するその他の情報
    case "TYPEEXPANDEDACCESSPROG":
      return fromOptions(TRIAL_POSITION_OPTIONS, n.applicExpandedAccess);
    case "OTHERCOMMENTS_PROTOCOL":
      return plain(txt(n.otherCommentsProtocol));
    // 「その他の情報 › その他」。その他備考（COMB_REMARKS）とは別項目
    case "OTHERCOMMENTS":
      return plain(txt(d?.drugOtherComments));

    // 治験届出者
    case "CLASSPERSONFILLNOTE":
      return plain(txt(ctx.sponsor.sponsorType));
    case "APPLICAT_NAME":
      return plain(txt(ctx.sponsor.name));
    case "APPLICAT_REP_NAME":
      return plain(txt(ctx.sponsor.repName));
    case "APPLICAT_ADDRESS1":
      return plain(txt(ctx.sponsor.address1));
    case "APPLICAT_ADDRESS2":
      return plain(txt(ctx.sponsor.address2));
    case "APPLICAT_PERSON_NAME":
      return plain(txt(ctx.sponsor.contactName));
    case "APPLICAT_PERSON_TITLE":
      return plain(txt(ctx.sponsor.contactTitle));
    case "APPLICAT_TELNUM":
      return plain(txt(ctx.sponsor.telNo));
    case "FAXNUMBER":
      return plain(txt(ctx.sponsor.faxOrMail));

    // 海外依頼者、外国製造業者（届出者側／薬別）
    case "FOREIGN_SPONSOR_NAME":
      return plain(txt(n.foreignName));
    case "FOREIGN_SPONSOR_REP_NAME":
      return plain(txt(n.foreignRepName));
    case "FOREIGN_SPONSOR_ADDRESS1":
      return plain(txt(n.foreignAddress1));
    case "FOREIGN_SPONSOR_ADDRESS2":
      return plain(txt(n.foreignAddress2));
    case "FOREIGN_NAME_FRGNLNG":
      return plain(txt(n.foreignNameFrgn));
    case "FOREIGN_SPOMSPR_REP_NAME_FRGNLNG":
      return plain(txt(n.foreignRepNameFrgn));
    case "FOREIGN_ADDRESS1_FRGNLNG":
      return plain(txt(n.foreignAddress1Frgn));
    case "FOREIGN_ADDRESS2_FRGNLNG":
      return plain(txt(n.foreignAddress2Frgn));
    case "COMB_FOREIGN_SPONSOR_NAME":
      return plain(txt(d?.foreignName));
    case "COMB_FOREIGN_SPONSOR_REP_NAME":
      return plain(txt(d?.foreignRepName));
    case "COMB_FOREIGN_SPONSOR_ADDRESS1":
      return plain(txt(d?.foreignAddress1));
    case "COMB_FOREIGN_SPONSOR_ADDRESS2":
      return plain(txt(d?.foreignAddress2));
    case "COMB_FOREIGN_NAME_FRGNLNG":
      return plain(txt(d?.foreignNameFrgn));
    case "COMB_FOREIGN_SPOMSPR_REP_NAME_FRGNLNG":
      return plain(txt(d?.foreignRepNameFrgn));
    case "COMB_FOREIGN_ADDRESS1_FRGNLNG":
      return plain(txt(d?.foreignAddress1Frgn));
    case "COMB_FOREIGN_ADDRESS2_FRGNLNG":
      return plain(txt(d?.foreignAddress2Frgn));

    // ---- その他治験使用薬 ----
    case "COMB_PRODUCTCATEGORY":
      return d?.productCategory == null ? plain("") : coded(String(d.productCategory), d.productCategory);
    case "COMBINATION_ID":
      return plain(txt(d?.drugName));
    case "TYPECOMBINATION_ID":
      return plain(txt(d?.idType));
    case "COMBINATIONCATEGORY":
      return d?.combCategory == null
        ? plain("")
        : coded(label(SET.combCategory, d.combCategory), d.combCategory);
    case "OTHERCOMBINATIONCATEGORY":
      return plain(txt(d?.combCategoryOther));
    case "COMB_APPLICATIONSTATUS":
      return plain(txt(d?.applicationStatus));
    case "COMB_CATEGTESTPRODUCTSUBJ30DAYREVIEW":
      return subj30(d?.drugSubj30dayReview);
    case "COMB_SPONSOR_NAME":
      return plain(txt(d?.plantName));
    case "COMB_SPONSOR_ADDRESS1":
      return plain(txt(d?.plantAddress1));
    case "COMB_SPONSOR_ADDRESS2":
      return plain(txt(d?.plantAddress2));
    case "COMB_MANUFACTURERIMPORTERCODE":
      return plain(txt(d?.plantCode));
    case "COMB_INGREDIENTSQUANTITIES":
      return plain(txt(d?.ingredients));
    case "COMB_DOSAGEFORMCODE":
      return plain(txt(d?.dosageFormCode));
    case "COMB_MANUFACTMETHOD":
      return plain(txt(d?.manufactMethod));
    case "COMB_INTENDINDICATIONSEFFECTS":
      return plain(txt(d?.intendEffects));
    case "COMB_EFFICACYCLASSCODENUMBER":
      return plain(txt(d?.efficacyClassCode));
    case "COMB_INTENDDOSAGEADMIN":
      return plain(txt(d?.intendDosage));
    case "COMB_ADMINROUTECODE":
      return plain(txt(d?.adminRouteCode));
    case "COMB_TARGETDISEASE":
      return plain(txt(d?.drugTargetDisease));
    case "COMB_DOSAGEADMIN":
      return plain(txt(d?.dosageAdmin));
    case "COMB_REMARKS":
      return plain(txt(d?.drugRemarks));
    case "COMB_PRESENCEADRREPORT":
      return plain(txt(d?.adrReport));

    // ---- 実施医療機関情報 ----
    case "INSTITUTE_NAME":
      return plain(txt(inst?.name));
    case "DEPARTMENT":
      return plain(txt(site?.department));
    case "INSTITUTE_ADDRESS1":
      return plain(txt(inst?.address1));
    case "INSTITUTE_ADDRESS2":
      return plain(txt(inst?.address2));
    case "INSTITUTE_TELNUM":
      return plain(txt(inst?.telNo));
    case "CHIEFINVEST_NAME":
    case "INVESTIGATER_NAME":
      return plain(txt(s.inv?.nameFiling));
    case "NUMMEDICALSCHOOL":
      return plain(txt(s.inv?.medSchoolNo));
    case "GRADUATYEARMEDICALSCHOOL":
      return plain(txt(s.inv?.graduationYear));
    case "CHIEFINVEST_PRONOUNCE":
    case "INVEST_PRONOUNCE":
      return plain(txt(s.inv?.pronounce));
    case "NAMEINVESTPRODUCT": {
      const drug = n.studyDrugs.find((x) => x.id === s.qty?.studyDrugId);
      return plain(txt(drug?.drugName));
    }
    case "QUANTITIESPLANNED":
      return plain(s.qty?.qtyNotation || num(s.qty?.qtyPlanned));
    case "QUANTITIESSUPPLIED":
      return plain(num(s.qty?.qtySupplied));
    case "QUANTITIESUSED":
      return plain(num(s.qty?.qtyUsed));
    case "QUANTITIESWITHDRAWN":
      return plain(num(s.qty?.qtyWithdrawn));
    case "QUANTITIESABROGATED":
      return plain(num(s.qty?.qtyAbrogated));
    case "PLANNUMSUBJMEDICALINSTUTUT":
      return plain(num(site?.plannedSubjects));
    case "NUMSUBJENROLLINSTITUTION":
      return plain(num(site?.enrolledSubjects));
    case "SMO_NAME":
      return plain(txt(site?.smoName));
    case "SMO_ADDRESS1":
      return plain(txt(site?.smoAddress1));
    case "SMO_ADDRESS2":
      return plain(txt(site?.smoAddress2));
    case "SMO_SERVICE":
      return plain(txt(site?.smoService));
    case "TYPEIRB":
      return irb == null ? plain("") : coded(label(SET.irbType, irb.irbType), irb.irbType);
    case "IRB_OWNER_NAME":
      return plain(txt(irb?.ownerName));
    case "IRB_ADDRESS1":
      return plain(txt(irb?.address1));
    case "IRB_ADDRESS2":
      return plain(txt(irb?.address2));
    case "OTHERS":
      return plain(txt(site?.others));
    case "FOOTNOTE":
      return plain(txt(n.footnote));

    // ---- 参照する治験届出情報 ----
    case "REF_PRODUCTCATEGORY":
      return plain(txt(s.reference?.refCategory));
    case "REF_INFOTESTSUBSTANCEIDCODE":
      return plain(txt(s.reference?.refCode));
    case "REF_SERIALNOTENUM":
      return plain(txt(s.reference?.refCount));
    case "TYPEREFFERENCE":
      return plain(txt(s.reference?.refType));

    // ---- 文脈で意味が変わる要素 ----
    // DETAIL は「該当する場合の詳述」（カルタヘナ）、「その他の場合の詳述」
    // （記号・名称等）、「内容」（備考）で使い回されている
    case "DETAIL":
      if (d) return plain(txt(d.idTypeDetail));
      if (s.attachment) return undefined;
      return plain(txt(n.applicCartagenaDetail || n.remarks));
    // APPLICABLEORNOT はコンパニオン診断薬・コンビネーション製品・国際共同治験・
    // ゲノム検査・マイクロドーズ・併用機械器具で使い回されている。
    // どの親の下かは buildFormDocument が親要素名を添えて呼ぶ
    case "CONTENTS":
      if (s.reference) return plain(txt(s.reference.refContents));
      return undefined;
    case "NAMEDOC":
      return plain(txt(s.attachment?.docName));
    // 届書添付資料の備考（資料名情報の後に出る欄）
    case "REMARK":
      return plain(txt(n.attachmentRemark));

    default:
      return undefined;
  }
}

/**
 * 親要素名で意味が変わる要素の値。同じ要素名（APPLICABLEORNOT / CONTENTS /
 * DETAIL）が複数の親の下で使われるため、親を見て振り分ける。
 */
export function valueOfWithin(parentEl: string, el: string, s: RowScope): Resolved | undefined {
  const { n } = s;
  const d = s.drug;
  if (el === "APPLICABLEORNOT") {
    switch (parentEl) {
      case "INFORESEARCHFORCODX":
      case "COMB_INFORESEARCHFORCODX":
        return applic(d ? d.drugApplicCodx : n.applicCodx);
      case "INFOCLINTRIALFORCOMBINATIONPROD":
      case "COMB_INFOCLINTRIALFORCOMBINATIONPROD":
        return applic(d ? d.drugApplicCombinationProd : n.applicCombinationProd);
      case "INFOGLOBALCLINTRIAL":
        return applic(n.isGlobal ? 1 : 0);
      case "INFOCLINTRIALINCLUDINGGENETEST":
        return applic(n.applicGeneTest);
      case "INFOPRODUSINGMDCLINTRIAL":
        return applic(n.applicMicrodose);
      case "INFOCOMBEQUIPMENT":
        return applic(n.applicCombEquipment);
      default:
        return plain("");
    }
  }
  if (el === "CONTENTS") {
    switch (parentEl) {
      case "INFOGLOBALCLINTRIAL":
        return plain(txt(n.globalContents));
      case "INFOCOMBEQUIPMENT":
        return plain(txt(n.combEquipmentContents));
      default:
        return valueOf(el, s);
    }
  }
  if (el === "DETAIL") {
    switch (parentEl) {
      case "INFOCLINTRIALWITHDRUGCARTAGENA":
        return plain(txt(n.applicCartagenaDetail));
      case "COMB_INFOCLINTRIALWITHDRUGCARTAGENA":
        return plain(txt(d?.drugApplicCartagenaDetail));
      case "INFOCOMBINATIONID":
        return plain(txt(d?.idTypeDetail));
      case "REMARKS":
        return plain(txt(n.remarks));
      default:
        return plain("");
    }
  }
  if (el === "MANUFACTURERIMPORTERCODE") {
    const main = n.studyDrugs.find((x) => x.drugRole === DRUG_ROLE.main);
    return parentEl === "INFOPERSONFILLNOTE"
      ? plain(txt(s.ctx.sponsor.manufacturerCode))
      : plain(txt(main?.plantCode));
  }
  return valueOf(el, s);
}
