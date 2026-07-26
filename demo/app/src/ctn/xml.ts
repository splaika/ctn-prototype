// ============================================================================
// CTN XML 生成（ホスト非依存モジュール）
// ----------------------------------------------------------------------------
// 本番の Custom API「GenerateCtnXml」に相当。デモ用サブセット構造を出力する。
// ※ これは公式XSD（iykckn_all_v3_0_0.xsd）ではなく、要素定義から起こした
//   デモ用サブセットである。公式XSD提供時に差し替えられるよう分離している。
// ハンドオフ第4節の分岐ルールを実装：
//   主たる被験薬→ルート直下 ／ その他→INFOCOMBINATION(SERIALNO1)
//   責任医師→INFOINVESTIGATOR ／ 分担医師→INFOSUBINVESTIGATOR (SERIALNO2)
//   数量→INFOQUANTITIESINVESTPRODUCT (SERIALNO2)
//   施設→INFOEACHMEDICALINSTITUT (SERIALNO1)
//   異動区分→STATUS属性（追加=APPEND / 削除=DELETE / 継続=NONE）
//   単票=UPDATE型 ／ 繰り返し行=ADD型
// ============================================================================
import { CHANGE_TYPE, DOCTOR_ROLE, DRUG_ROLE, NOTIF_TYPE_VALUE } from "./refData";
import type {
  Compound,
  Institution,
  Irb,
  Notification,
  Sponsor,
} from "./types";

export interface XmlContext {
  compound: Compound;
  sponsor: Sponsor;
  institutions: Map<string, Institution>;
  irbs: Map<string, Irb>;
}

const esc = (s: string | number | undefined): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const statusForChangeType = (changeType: number): "APPEND" | "DELETE" | "NONE" => {
  if (changeType === CHANGE_TYPE.add) return "APPEND";
  if (changeType === CHANGE_TYPE.remove) return "DELETE";
  return "NONE";
};

class Xml {
  private lines: string[] = [];
  private depth = 0;
  open(tag: string, attrs: Record<string, string | number | undefined> = {}) {
    this.lines.push(`${"  ".repeat(this.depth)}<${tag}${this.attrs(attrs)}>`);
    this.depth++;
  }
  close(tag: string) {
    this.depth--;
    this.lines.push(`${"  ".repeat(this.depth)}</${tag}>`);
  }
  leaf(tag: string, value: string | number | undefined, attrs: Record<string, string | number | undefined> = {}) {
    const v = esc(value);
    this.lines.push(`${"  ".repeat(this.depth)}<${tag}${this.attrs(attrs)}>${v}</${tag}>`);
  }
  private attrs(a: Record<string, string | number | undefined>): string {
    const parts = Object.entries(a)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => ` ${k}="${esc(v)}"`);
    return parts.join("");
  }
  toString() {
    return this.lines.join("\n");
  }
}

export function generateCtnXml(n: Notification, ctx: XmlContext): string {
  const x = new Xml();
  x.open("CLINICALTRIALNOTIFICATION", {
    NOTIFTYPE: NOTIF_TYPE_VALUE[n.notifType],
    STATUS: "UPDATE", // 単票項目はUPDATE型
  });

  // ---- 様式等のバージョン情報（INFOFORMVERSION） ----
  x.leaf("INFOFORMVERSION", n.formVersion ?? "医薬品治験届 令和２年８月改正版");
  // ---- ルート共通（成分・回数・受付番号） ----
  x.leaf("COMPOUNDCODE", ctx.compound.compoundCode);
  // 開発中止届は届出回数不要（"00"）。それ以外は対象プロトコールの届出回数。
  x.leaf("FILINGCOUNT", n.notifType === "devDiscontinuation" ? "00" : n.filingCount);
  if (n.changeCount != null) x.leaf("CHANGECOUNT", n.changeCount);
  if (n.notifType === "change") {
    if (n.changeDate) x.leaf("CHANGEDATE", n.changeDate);
    if (n.changeReason) x.leaf("CHANGEREASON", n.changeReason);
  }
  if (n.receptNo) x.leaf("RECEPTNO", n.receptNo);
  x.leaf("NOTEDATE", n.noteDate ?? "");
  x.leaf("KUBUN", n.kubun ?? "");
  x.leaf("PROTOCOLNO", n.protocolNo);
  x.leaf("OBJECTIVES", n.objectives);
  x.leaf("TARGETDISEASE", n.targetDisease);

  // ---- 手引き4.3 条件付き項目（該当時のみ出力） ----
  // 該当区分は ATTR_UPDATE_TYPE のリーフ値（コンテナではない）。DETAIL/APPLICABLEORNOT の
  // 親子関係は手引き突合が必要（要確認）のため、本サブセットでは該当有無を値として出力する。
  if (n.applicBiological != null) x.leaf("TYPEBIOLOGICALPROD", n.applicBiological);
  if (n.applicCartagena != null) x.leaf("TYPECLINTRIALWITHDRUGCARTAGENA", n.applicCartagena);
  if (n.applicExpandedAccess != null) x.leaf("TYPEEXPANDEDACCESSPROG", n.applicExpandedAccess);
  // その他の情報（該当性トグル・XSD v3.0.0）。APPLICABLEORNOT のリーフ値として出力（サブセット）。
  if (n.applicCodx != null) x.leaf("INFORESEARCHFORCODX_APPLICABLEORNOT", n.applicCodx);
  if (n.applicCombinationProd != null) x.leaf("INFOCLINTRIALFORCOMBINATIONPROD_APPLICABLEORNOT", n.applicCombinationProd);
  if (n.applicGeneTest != null) x.leaf("INFOCLINTRIALINCLUDINGGENETEST_APPLICABLEORNOT", n.applicGeneTest);
  if (n.applicMicrodose != null) x.leaf("INFOPRODUSINGMDCLINTRIAL_APPLICABLEORNOT", n.applicMicrodose);
  if (n.applicCombEquipment != null) {
    x.open("INFOCOMBEQUIPMENT", { SERIALNO1: 1, STATUS: "ADD" });
    x.leaf("APPLICABLEORNOT", n.applicCombEquipment);
    if (n.combEquipmentContents) x.leaf("CONTENTS", n.combEquipmentContents);
    x.close("INFOCOMBEQUIPMENT");
  }
  // 国際共同治験（該当有無＋内容）
  if (n.isGlobal || n.globalContents) {
    x.open("INFOGLOBALCLINTRIAL", {});
    x.leaf("APPLICABLEORNOT", n.isGlobal ? 1 : 0);
    if (n.globalContents) x.leaf("CONTENTS", n.globalContents);
    x.close("INFOGLOBALCLINTRIAL");
  }
  if (n.chargeOutPersonName) {
    x.open("CHARGEOUTPERSONCLINTRIAL", { SERIALNO1: 1, STATUS: "ADD" });
    x.leaf("CHARGEOUTPERSONNAME", n.chargeOutPersonName);
    if (n.validityReasons) x.leaf("VALIDITYREASONS", n.validityReasons);
    x.close("CHARGEOUTPERSONCLINTRIAL");
  }
  if (n.otherCommentsPrimary) x.leaf("OTHERCOMMENTS_PRIMARY", n.otherCommentsPrimary);
  if (n.otherCommentsProtocol) x.leaf("OTHERCOMMENTS_PROTOCOL", n.otherCommentsProtocol);
  if (n.croName) {
    x.open("INFOCRO", { SERIALNO1: 1, STATUS: "ADD" });
    x.leaf("CRO_NAME", n.croName);
    if (n.croAddress1) x.leaf("CRO_ADDRESS1", n.croAddress1);
    if (n.croAddress2) x.leaf("CRO_ADDRESS2", n.croAddress2);
    if (n.croService) x.leaf("CRO_SERVICE", n.croService);
    x.close("INFOCRO");
  }
  if (n.coordName) {
    x.open("INFOCOORDINVESTIGATOR", { SERIALNO1: 1, STATUS: "ADD" });
    x.leaf("KEYINVEST_NAME", n.coordName);
    if (n.coordAffiliation) x.leaf("KEYINVEST_AFFILIATION", n.coordAffiliation);
    if (n.coordInstitution) x.leaf("NAMEMEDICALINSTITUT", n.coordInstitution);
    x.close("INFOCOORDINVESTIGATOR");
  }

  // ---- 治験届出者（INFOPERSONFILLNOTE / SERIALNO1・ADD型） ----
  x.open("INFOPERSONFILLNOTE", { SERIALNO1: 1, STATUS: "ADD" });
  x.leaf("SPONSORNAME", ctx.sponsor.name);
  x.leaf("REPNAME", ctx.sponsor.repName);
  x.leaf("MANUFACTURERCODE", ctx.sponsor.manufacturerCode);
  x.leaf("CONTACTNAME", ctx.sponsor.contactName);
  x.leaf("TELNO", ctx.sponsor.telNo);
  x.close("INFOPERSONFILLNOTE");

  // ---- 海外依頼者・外国製造業者（INFOFOREIGNMANUFACTURER・該当時のみ・単数） ----
  if (n.foreignName || n.foreignNameFrgn) {
    x.open("INFOFOREIGNMANUFACTURER", { SERIALNO1: 1, STATUS: "ADD" });
    if (n.foreignName) x.leaf("FOREIGN_SPONSOR_NAME", n.foreignName);
    if (n.foreignRepName) x.leaf("FOREIGN_SPONSOR_REP_NAME", n.foreignRepName);
    if (n.foreignAddress1) x.leaf("FOREIGN_SPONSOR_ADDRESS1", n.foreignAddress1);
    if (n.foreignAddress2) x.leaf("FOREIGN_SPONSOR_ADDRESS2", n.foreignAddress2);
    if (n.foreignNameFrgn) x.leaf("FOREIGN_NAME_FRGNLNG", n.foreignNameFrgn);
    if (n.foreignRepNameFrgn) x.leaf("FOREIGN_SPOMSPR_REP_NAME_FRGNLNG", n.foreignRepNameFrgn);
    if (n.foreignAddress1Frgn) x.leaf("FOREIGN_ADDRESS1_FRGNLNG", n.foreignAddress1Frgn);
    if (n.foreignAddress2Frgn) x.leaf("FOREIGN_ADDRESS2_FRGNLNG", n.foreignAddress2Frgn);
    x.close("INFOFOREIGNMANUFACTURER");
  }

  // ---- 治験使用薬：主たる→ルート直下 / その他→INFOCOMBINATION ----
  const main = n.studyDrugs.find((d) => d.drugRole === DRUG_ROLE.main);
  if (main) {
    x.open("MAININVESTPRODUCT", { SERIALNO1: main.serialNo });
    x.leaf("DRUGNAME", main.drugName);
    x.leaf("PLANTNAME", main.plantName);
    x.leaf("PLANTCODE", main.plantCode);
    x.leaf("INGREDIENTS", main.ingredients);
    x.leaf("INTENDDOSAGE", main.intendDosage);
    x.leaf("EFFICACYCLASSCODE", main.efficacyClassCode);
    x.close("MAININVESTPRODUCT");
  }
  for (const d of n.studyDrugs.filter((d) => d.drugRole === DRUG_ROLE.other)) {
    x.open("INFOCOMBINATION", { SERIALNO1: d.serialNo, STATUS: "ADD" });
    if (d.productCategory != null) x.leaf("COMB_PRODUCTCATEGORY", d.productCategory);
    x.leaf("COMBINATION_ID", d.drugName);
    if (d.idType) x.leaf("TYPECOMBINATION_ID", d.idType);
    if (d.idTypeDetail) x.leaf("DETAIL", d.idTypeDetail);
    if (d.combCategory != null) x.leaf("COMBINATIONCATEGORY", d.combCategory);
    if (d.combCategoryOther) x.leaf("OTHERCOMBINATIONCATEGORY", d.combCategoryOther);
    if (d.applicationStatus) x.leaf("COMB_APPLICATIONSTATUS", d.applicationStatus);
    if (d.drugSubj30dayReview != null) x.leaf("COMB_CATEGTESTPRODUCTSUBJ30DAYREVIEW", d.drugSubj30dayReview);
    x.leaf("PLANTNAME", d.plantName);
    x.leaf("PLANTCODE", d.plantCode);
    if (d.drugTargetDisease) x.leaf("COMB_TARGETDISEASE", d.drugTargetDisease);
    if (d.drugApplicCartagena != null) x.leaf("COMB_TYPECLINTRIALWITHDRUGCARTAGENA", d.drugApplicCartagena);
    if (d.drugApplicBiological != null) x.leaf("COMB_TYPEBIOLOGICALPROD", d.drugApplicBiological);
    if (d.drugApplicCodx != null) x.leaf("COMB_INFORESEARCHFORCODX_APPLICABLEORNOT", d.drugApplicCodx);
    if (d.drugApplicCombinationProd != null) x.leaf("COMB_INFOCLINTRIALFORCOMBINATIONPROD_APPLICABLEORNOT", d.drugApplicCombinationProd);
    if (d.foreignName || d.foreignNameFrgn) {
      x.open("COMB_INFOFOREIGNMANUFACTURER", { SERIALNO1: 1, STATUS: "ADD" });
      if (d.foreignName) x.leaf("COMB_FOREIGN_SPONSOR_NAME", d.foreignName);
      if (d.foreignRepName) x.leaf("COMB_FOREIGN_SPONSOR_REP_NAME", d.foreignRepName);
      if (d.foreignAddress1) x.leaf("COMB_FOREIGN_SPONSOR_ADDRESS1", d.foreignAddress1);
      if (d.foreignAddress2) x.leaf("COMB_FOREIGN_SPONSOR_ADDRESS2", d.foreignAddress2);
      if (d.foreignNameFrgn) x.leaf("COMB_FOREIGN_NAME_FRGNLNG", d.foreignNameFrgn);
      if (d.foreignRepNameFrgn) x.leaf("COMB_FOREIGN_SPOMSPR_REP_NAME_FRGNLNG", d.foreignRepNameFrgn);
      if (d.foreignAddress1Frgn) x.leaf("COMB_FOREIGN_ADDRESS1_FRGNLNG", d.foreignAddress1Frgn);
      if (d.foreignAddress2Frgn) x.leaf("COMB_FOREIGN_ADDRESS2_FRGNLNG", d.foreignAddress2Frgn);
      x.close("COMB_INFOFOREIGNMANUFACTURER");
    }
    if (d.drugRemarks) x.leaf("COMB_REMARKS", d.drugRemarks);
    if (d.adrReport) x.leaf("COMB_PRESENCEADRREPORT", d.adrReport);
    x.close("INFOCOMBINATION");
  }

  // ---- 実施医療機関（INFOEACHMEDICALINSTITUT / SERIALNO1） ----
  for (const s of n.sites) {
    const inst = ctx.institutions.get(s.institutionId);
    const irb = ctx.irbs.get(s.irbId);
    x.open("INFOEACHMEDICALINSTITUT", { SERIALNO1: s.serialNo, STATUS: "ADD" });
    x.leaf("INSTITUTENAME", inst?.name ?? s.institutionId);
    x.leaf("DEPARTMENT", s.department);
    x.leaf("PLANNEDSUBJECTS", s.plannedSubjects);
    if (s.enrolledSubjects != null) x.leaf("ENROLLEDSUBJECTS", s.enrolledSubjects);
    if (irb) {
      // INFOIRB（孫・SERIALNO2・ADD型）。各施設は単一IRBを参照するため SERIALNO2=1。
      x.open("INFOIRB", { SERIALNO2: 1, STATUS: "ADD" });
      x.leaf("IRBTYPE", irb.irbType);
      x.leaf("OWNERNAME", irb.ownerName);
      x.close("INFOIRB");
    }

    // 医師：責任→INFOINVESTIGATOR / 分担→INFOSUBINVESTIGATOR（SERIALNO2）
    for (const inv of s.investigators) {
      const tag = inv.doctorRole === DOCTOR_ROLE.responsible ? "INFOINVESTIGATOR" : "INFOSUBINVESTIGATOR";
      x.open(tag, { SERIALNO2: inv.serialNo, STATUS: statusForChangeType(inv.changeType) });
      x.leaf("NAMEFILING", inv.nameFiling);
      x.leaf("PRONOUNCE", inv.pronounce);
      if (inv.doctorRole === DOCTOR_ROLE.responsible) {
        x.leaf("MEDSCHOOLNO", inv.medSchoolNo);
        x.leaf("GRADUATIONYEAR", inv.graduationYear);
      }
      if (inv.changeDate) x.leaf("CHANGEDATE", inv.changeDate);
      x.close(tag);
    }

    // 数量：INFOQUANTITIESINVESTPRODUCT（SERIALNO2、薬名称は治験使用薬から展開）
    for (const q of s.quantities) {
      const drug = n.studyDrugs.find((d) => d.id === q.studyDrugId);
      x.open("INFOQUANTITIESINVESTPRODUCT", { SERIALNO2: q.serialNo, STATUS: "ADD" });
      x.leaf("DRUGNAME", drug?.drugName ?? "");
      x.leaf("QTYPLANNED", q.qtyPlanned);
      if (q.qtySupplied != null) x.leaf("QTYSUPPLIED", q.qtySupplied);
      if (q.qtyUsed != null) x.leaf("QTYUSED", q.qtyUsed);
      if (q.qtyWithdrawn != null) x.leaf("QTYWITHDRAWN", q.qtyWithdrawn);
      if (q.qtyAbrogated != null) x.leaf("QTYABROGATED", q.qtyAbrogated);
      x.close("INFOQUANTITIESINVESTPRODUCT");
    }
    x.close("INFOEACHMEDICALINSTITUT");
  }

  // ---- 中止情報 ----
  if (n.terminationDate) {
    x.open("INFOTERMINATION", {});
    x.leaf("TERMINATIONDATE", n.terminationDate);
    x.leaf("TERMINATIONREASON", n.terminationReason);
    if (n.postTermination) x.leaf("POSTTERMINATION", n.postTermination);
    x.close("INFOTERMINATION");
  }

  if (n.remarks) x.leaf("REMARKS", n.remarks);

  // ---- 届書添付資料（DOCATTACHEDNOTE / INFONAMEDOCUMENTS）— 資料名を出力 ----
  // XSDは資料名（NAMEDOC）のみ保持。実ファイルの中身はXMLには埋め込まず、
  // 提出パッケージの添付ファイルとして別途同梱する（Packing List等）。
  if (n.attachments.length) {
    x.open("DOCATTACHEDNOTE", {});
    n.attachments.forEach((a, i) => {
      x.open("INFONAMEDOCUMENTS", { SERIALNO1: i + 1, STATUS: "ADD" });
      x.leaf("NAMEDOC", a.docName);
      x.close("INFONAMEDOCUMENTS");
    });
    x.close("DOCATTACHEDNOTE");
  }

  x.close("CLINICALTRIALNOTIFICATION");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${x.toString()}`;
}

// ---- デモ用サブセットXSD相当の妥当性チェック（機械検証の縮退版） ----
export interface XsdCheck {
  ok: boolean;
  errors: string[];
  warnings: string[];
  elementCount: number;
}
export function validateAgainstSubset(n: Notification, xml: string): XsdCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isTerminal = n.notifType === "termination" || n.notifType === "completion";
  const needsPlanFields = n.notifType === "plan" || n.notifType === "change";

  // 開発中止届は治験使用薬・実施医療機関ともに対象外（requiredByType「―」）
  if (n.notifType !== "devDiscontinuation" && !n.studyDrugs.some((d) => d.drugRole === DRUG_ROLE.main))
    errors.push("主たる被験薬が1行必要です（1届1行）。");
  if (n.studyDrugs.filter((d) => d.drugRole === DRUG_ROLE.main).length > 1)
    errors.push("主たる被験薬は1行のみ許可されます。");
  if (n.notifType !== "devDiscontinuation" && n.sites.length === 0)
    errors.push("実施医療機関が1件以上必要です。");
  if (!n.sponsorId) errors.push("治験届出者が未設定です。");
  if (needsPlanFields && !n.protocolNo) warnings.push("実施計画書識別記号が未入力です。");
  if (isTerminal)
    for (const s of n.sites)
      for (const q of s.quantities)
        if (q.qtySupplied == null) {
          warnings.push("終了/中止届では交付〜廃棄の数量入力が必要です。");
          break;
        }

  const elementCount = (xml.match(/<[A-Z]/g) ?? []).length;
  return { ok: errors.length === 0, errors, warnings, elementCount };
}
