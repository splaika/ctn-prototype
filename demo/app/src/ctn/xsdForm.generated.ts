// ============================================================================
// xsdForm.generated.ts — 公式XSD から生成（手で編集しないこと）
// ----------------------------------------------------------------------------
// 生成元 : archive/outputs/ctn-xsd-mapping/iykckn_all_v3_0_0.xsd（厚生労働省・v3.0.0）
// 生成子 : demo/app/scripts/gen-xsd-form.py（npm run xsd:gen）
//
// 届書の項目名・要素名・入れ子・出現順・STATUS の種類はすべてXSDが正。
// 画面ラベル・CTN XML・届書PDF はこのツリーを読むことで公式と一致する。
// ============================================================================

/** 値要素の STATUS の種類。XSD の ATTR_*_TYPE に対応する */
export type XsdStatusKind = "update" | "add" | "updateNoValue" | null;

export interface XsdNode {
  /** XSD の要素名 */
  el: string;
  /** VARIABLELABEL に入る項目名。画面ラベルもこれを使う */
  label: string;
  kind: "value" | "group";
  /** value のときだけ意味を持つ */
  status?: XsdStatusKind;
  /** maxOccurs="unbounded"（繰り返し行） */
  repeat?: boolean;
  /** minOccurs="0" */
  optional?: boolean;
  children?: XsdNode[];
}

export const XSD_ROOT = "CLINTRIALPLANNOTE";
export const XSD_VERSION = "3.0.0";

export const XSD_FORM: XsdNode[] = [
  { el: "INFOFORMVERSION", label: "様式等のバージョン情報", kind: "value", status: "update" },
  { el: "COMMONINFOCLINTRIALPLANNOTE", label: "治験届出共通事項", kind: "group", children: [
    { el: "TESTSUBSTANCEIDCODE", label: "主たる被験薬の治験成分記号", kind: "value", status: "update" },
    { el: "TYPECLINTRIALS", label: "治験の種類", kind: "value", status: "update" },
    { el: "RECEPTNUMINITNOTE", label: "主たる被験薬の初回届出受付番号", kind: "value", status: "update" },
    { el: "INITNOTEDATE", label: "主たる被験薬の初回届出年月日", kind: "value", status: "update" },
    { el: "SERIALNOTENUM", label: "主たる被験薬の届出回数", kind: "value", status: "update", optional: true },
    { el: "RECEPTNUMCLINTRIALPLANNOTE", label: "当該治験計画届出受付番号", kind: "value", status: "update", optional: true },
    { el: "CLINTRIALPLANNOTEDATE", label: "当該治験計画届出年月日", kind: "value", status: "update", optional: true },
  ] },
  { el: "INFONOTE", label: "主たる被験薬に関する届出事項", kind: "group", children: [
    { el: "NOTEDATE", label: "届出年月日", kind: "value", status: "update" },
    { el: "CLASSNOTE", label: "届出分類", kind: "value", status: "update" },
    { el: "TIMESCHANGE", label: "変更回数", kind: "value", status: "update", optional: true },
    { el: "CATEGORYNOTE", label: "届出区分", kind: "value", status: "update" },
    { el: "CATEGTESTPRODUCTSUBJ30DAYREVIEW", label: "主たる被験薬の30日調査対応被験薬区分", kind: "value", status: "updateNoValue", optional: true },
    { el: "INFOPREMATURETERMINATION", label: "中止情報", kind: "group", children: [
      { el: "TERMINATIONDATE", label: "中止日年月日", kind: "value", status: "update" },
      { el: "REASONTERMINATION", label: "中止理由", kind: "value", status: "update" },
      { el: "POSTTERMINATIONMEASURE", label: "その後の対応状況", kind: "value", status: "update", optional: true },
    ] },
    { el: "INFONAMEADDRESSMANUFACTPLANT", label: "主たる被験薬の製造所又は営業所（治験薬提供者）の名称及び所在地", kind: "group", optional: true, children: [
      { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
      { el: "SPONSOR_NAME", label: "名称", kind: "value", status: "update" },
      { el: "SPONSOR_ADDRESS1", label: "所在地１", kind: "value", status: "update" },
      { el: "SPONSOR_ADDRESS2", label: "所在地２", kind: "value", status: "update" },
      { el: "MANUFACTURERIMPORTERCODE", label: "業者コード", kind: "value", status: "update" },
    ] },
    { el: "INFOINGREDIENTQUANTITY", label: "主たる被験薬の成分及び分量情報", kind: "group", optional: true, children: [
      { el: "INGREDIENTSQUANTITIES", label: "成分及び分量", kind: "value", status: "update" },
      { el: "INFODOSAGEFORMCODE", label: "剤形コード情報", kind: "group", children: [
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "DOSAGEFORMCODE", label: "剤形コード", kind: "value", status: "update" },
      ] },
    ] },
    { el: "MANUFACTMETHOD", label: "主たる被験薬の製造方法", kind: "value", status: "update", optional: true },
    { el: "INFOINTENDINDICATIONSEFFECTS", label: "主たる被験薬の予定される効能又は効果情報", kind: "group", optional: true, children: [
      { el: "INTENDINDICATIONSEFFECTS", label: "予定される効能又は効果", kind: "value", status: "update" },
      { el: "EFFICACYCLASSCODENUMBER", label: "薬効分類番号", kind: "value", status: "update" },
    ] },
    { el: "INFOINTENDDOSAGEADMIN", label: "主たる被験薬の予定される用法及び用量情報", kind: "group", optional: true, children: [
      { el: "INTENDDOSAGEADMIN", label: "予定される用法及び用量", kind: "value", status: "update" },
      { el: "INFOADMINROUTECODE", label: "投与経路コード情報", kind: "group", children: [
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "ADMINROUTECODE", label: "投与経路コード", kind: "value", status: "update" },
      ] },
    ] },
    { el: "SUMMARYPROTOCOL", label: "", kind: "group", optional: true, children: [
      { el: "PROTOCOLNUM", label: "実施計画書識別記号", kind: "value", status: "update" },
      { el: "PHASECLINTRIAL", label: "開発の相", kind: "value", status: "update" },
      { el: "TYPECLINTRIAL", label: "試験の種類", kind: "value", status: "update" },
      { el: "TRIALOBJECTIVES", label: "目的", kind: "value", status: "update" },
      { el: "INFOPLANNUMSUBJ", label: "予定被験者数情報", kind: "group", children: [
        { el: "PLANNUMSUBJTESTPRODUCT", label: "予定被験者数（被験薬）", kind: "value", status: "update" },
        { el: "PLANNUMSUBJECTSTOTAL", label: "予定被験者数（合計）", kind: "value", status: "update" },
      ] },
      { el: "TARGETDISEASE", label: "主たる被験薬の対象疾患", kind: "value", status: "update" },
      { el: "INFODOSAGEADMIN", label: "主たる被験薬の用法及び用量情報", kind: "group", children: [
        { el: "DOSAGEADMIN", label: "用法及び用量", kind: "value", status: "update" },
        { el: "INFOADMINROUTECODE", label: "投与経路コード情報", kind: "group", children: [
          { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
          { el: "ADMINROUTECODE", label: "投与経路コード", kind: "value", status: "update" },
        ] },
      ] },
      { el: "WHOLEDURATIONCLINTRIAL", label: "実施期間", kind: "group", children: [
        { el: "STARTDATECLINTRIAL", label: "開始日年月日", kind: "value", status: "update" },
        { el: "ENDDATECLINTRIAL", label: "終了日年月日", kind: "value", status: "update" },
      ] },
      { el: "REASONONEROUS", label: "有償の理由等", kind: "value", status: "update" },
      { el: "CHARGEOUTPERSONCLINTRIAL", label: "治験の費用負担者に関する情報", kind: "group", children: [
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "CHARGEOUTPERSONNAME", label: "費用負担者氏名", kind: "value", status: "update" },
        { el: "VALIDITYREASONS", label: "妥当性", kind: "value", status: "update" },
      ] },
      { el: "INFOCOORDINVESTIGATOR", label: "治験調整医師又は治験調整委員会構成医師に関する情報", kind: "group", children: [
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "KEYINVEST_NAME", label: "治験調整医師の氏名", kind: "value", status: "update" },
        { el: "NAMEMEDICALINSTITUT", label: "治験調整医師の所属機関", kind: "value", status: "update" },
        { el: "KEYINVEST_AFFILIATION", label: "治験調整医師の所属", kind: "value", status: "update" },
      ] },
      { el: "INFOCRO", label: "治験の依頼（準備）及び管理に関する業務の全部又は一部を受託する者（開発業務受託機関（ＣＲＯ））の氏名、住所及び委託する業務の範囲", kind: "group", children: [
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "CRO_NAME", label: "氏名", kind: "value", status: "update" },
        { el: "CRO_ADDRESS1", label: "住所１", kind: "value", status: "update" },
        { el: "CRO_ADDRESS2", label: "住所２", kind: "value", status: "update" },
        { el: "CRO_SERVICE", label: "委託する業務の範囲", kind: "value", status: "update" },
      ] },
    ] },
    { el: "INFOOTHERS_PRIMARY", label: "", kind: "group", optional: true, children: [
      { el: "INFOCLINTRIALWITHDRUGCARTAGENA", label: "カルタヘナ法の対象となる薬物を用いる治験", kind: "group", children: [
        { el: "TYPECLINTRIALWITHDRUGCARTAGENA", label: "該当の有無等", kind: "value", status: "update" },
        { el: "DETAIL", label: "該当する場合の詳述", kind: "value", status: "update", optional: true },
      ] },
      { el: "INFOCLINTRIALWITHBIOLOGICALPROD", label: "生物由来製品に指定が見込まれる薬物を用いる治験", kind: "group", children: [
        { el: "TYPEBIOLOGICALPROD", label: "該当の有無等", kind: "value", status: "update" },
      ] },
      { el: "INFORESEARCHFORCODX", label: "対応するコンパニオン診断薬等の開発", kind: "group", children: [
        { el: "APPLICABLEORNOT", label: "該当の有無", kind: "value", status: "update" },
      ] },
      { el: "INFOCLINTRIALFORCOMBINATIONPROD", label: "コンビネーション製品に関する治験", kind: "group", children: [
        { el: "APPLICABLEORNOT", label: "該当の有無", kind: "value", status: "update" },
      ] },
      { el: "OTHERCOMMENTS_PRIMARY", label: "その他", kind: "value", status: "update", optional: true },
    ] },
    { el: "INFOOTHERS_PROTOCOL", label: "", kind: "group", optional: true, children: [
      { el: "INFOEXPANDEDACCESSPROG", label: "臨床試験の位置付け", kind: "group", children: [
        { el: "TYPEEXPANDEDACCESSPROG", label: "該当の有無等", kind: "value", status: "update" },
      ] },
      { el: "INFOGLOBALCLINTRIAL", label: "国際共同治験", kind: "group", children: [
        { el: "APPLICABLEORNOT", label: "該当の有無等", kind: "value", status: "update" },
        { el: "CONTENTS", label: "内容", kind: "value", status: "update", optional: true },
      ] },
      { el: "INFOCLINTRIALINCLUDINGGENETEST", label: "ゲノム検査等を含む治験", kind: "group", children: [
        { el: "APPLICABLEORNOT", label: "該当の有無等", kind: "value", status: "update" },
      ] },
      { el: "INFOPRODUSINGMDCLINTRIAL", label: "マイクロドーズ臨床試験を利用した開発品目", kind: "group", children: [
        { el: "APPLICABLEORNOT", label: "該当の有無等", kind: "value", status: "update" },
      ] },
      { el: "INFOCOMBEQUIPMENT", label: "当該届出に関する治験に併用する機械器具等の記載", kind: "group", children: [
        { el: "APPLICABLEORNOT", label: "該当の有無", kind: "value", status: "update" },
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "CONTENTS", label: "内容", kind: "value", status: "update" },
      ] },
      { el: "OTHERCOMMENTS_PROTOCOL", label: "その他", kind: "value", status: "update", optional: true },
    ] },
    { el: "REMARKS", label: "備考", kind: "group", children: [
      { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
      { el: "DETAIL", label: "内容", kind: "value", status: "update" },
    ] },
    { el: "DOCATTACHEDNOTE", label: "届書添付資料", kind: "group", children: [
      { el: "INFONAMEDOCUMENTS", label: "資料名情報", kind: "group", children: [
        { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
        { el: "NAMEDOC", label: "資料名", kind: "value", status: "update" },
      ] },
      { el: "REMARK", label: "備考", kind: "value", status: "update" },
    ] },
    { el: "INFOPERSONFILLNOTE", label: "治験届出者に関する情報", kind: "group", children: [
      { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
      { el: "CLASSPERSONFILLNOTE", label: "治験届出者の種別", kind: "value", status: "update" },
      { el: "APPLICAT_NAME", label: "届出者の名称", kind: "value", status: "update" },
      { el: "APPLICAT_REP_NAME", label: "届出者の(代表者の)氏名", kind: "value", status: "update" },
      { el: "APPLICAT_ADDRESS1", label: "所在地１", kind: "value", status: "update" },
      { el: "APPLICAT_ADDRESS2", label: "所在地２", kind: "value", status: "update" },
      { el: "MANUFACTURERIMPORTERCODE", label: "業者コード", kind: "value", status: "update" },
      { el: "INFOPERSONASSIGNNOTE", label: "", kind: "group", children: [
        { el: "APPLICAT_PERSON_NAME", label: "担当者の氏名", kind: "value", status: "update" },
        { el: "APPLICAT_PERSON_TITLE", label: "担当者の所属", kind: "value", status: "update" },
        { el: "APPLICAT_TELNUM", label: "電話番号", kind: "value", status: "update" },
        { el: "FAXNUMBER", label: "ＦＡＸ番号又はメールアドレス", kind: "value", status: "update" },
      ] },
    ] },
    { el: "INFOFOREIGNMANUFACTURER", label: "海外依頼者、外国製造業者に関する情報", kind: "group", optional: true, children: [
      { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
      { el: "FOREIGN_SPONSOR_NAME", label: "海外依頼者、外国製造業者の名称（邦文）", kind: "value", status: "update" },
      { el: "FOREIGN_SPONSOR_REP_NAME", label: "海外依頼者、外国製造業者の(代表者の)氏名（邦文）", kind: "value", status: "update" },
      { el: "FOREIGN_SPONSOR_ADDRESS1", label: "所在地１（邦文）", kind: "value", status: "update" },
      { el: "FOREIGN_SPONSOR_ADDRESS2", label: "所在地２（邦文）", kind: "value", status: "update" },
      { el: "FOREIGN_NAME_FRGNLNG", label: "海外依頼者、外国製造業者の名称（外国文）", kind: "value", status: "update" },
      { el: "FOREIGN_SPOMSPR_REP_NAME_FRGNLNG", label: "海外依頼者、外国製造業者の(代表者の)氏名（外国文）", kind: "value", status: "update" },
      { el: "FOREIGN_ADDRESS1_FRGNLNG", label: "所在地１（外国文）", kind: "value", status: "update" },
      { el: "FOREIGN_ADDRESS2_FRGNLNG", label: "所在地２（外国文）", kind: "value", status: "update" },
    ] },
  ] },
  { el: "INFOCOMBINATION", label: "治験使用薬、治験使用機器相当、治験使用製品相当（主たる被験薬を除く。）の情報", kind: "group", optional: true, children: [
    { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
    { el: "COMB_PRODUCTCATEGORY", label: "医薬品／医療機器／再生医療等製品の別", kind: "value", status: "update" },
    { el: "INFOCOMBINATIONID", label: "", kind: "group", children: [
      { el: "COMBINATION_ID", label: "記号・名称等", kind: "value", status: "update" },
      { el: "TYPECOMBINATION_ID", label: "記号・名称等の種類", kind: "value", status: "update" },
      { el: "DETAIL", label: "その他の場合の詳述", kind: "value", status: "update", optional: true },
    ] },
    { el: "INFOCOMBINATIONCATEGORY", label: "", kind: "group", children: [
      { el: "COMBINATIONCATEGORY", label: "被験薬／対照薬／併用薬／レスキュー薬などの区別", kind: "value", status: "update" },
      { el: "OTHERCOMBINATIONCATEGORY", label: "その他の場合の治験使用薬、治験使用機器相当、治験使用製品相当の別", kind: "value", status: "update", optional: true },
    ] },
    { el: "COMB_APPLICATIONSTATUS", label: "国内における承認状況", kind: "value", status: "update" },
    { el: "COMB_INFONOTE", label: "", kind: "group", children: [
      { el: "COMB_CATEGTESTPRODUCTSUBJ30DAYREVIEW", label: "30日調査対応被験薬区分", kind: "value", status: "updateNoValue", optional: true },
      { el: "COMB_INFONAMEADDRESSMANUFACTPLANT", label: "製造所又は営業所（治験薬提供者）の名称及び所在地", kind: "group", optional: true, children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "COMB_SPONSOR_NAME", label: "名称", kind: "value", status: "update" },
        { el: "COMB_SPONSOR_ADDRESS1", label: "所在地１", kind: "value", status: "update" },
        { el: "COMB_SPONSOR_ADDRESS2", label: "所在地２", kind: "value", status: "update" },
        { el: "COMB_MANUFACTURERIMPORTERCODE", label: "業者コード", kind: "value", status: "update" },
      ] },
      { el: "COMB_INFOINGREDIENTQUANTITY", label: "成分及び分量情報", kind: "group", optional: true, children: [
        { el: "COMB_INGREDIENTSQUANTITIES", label: "成分及び分量", kind: "value", status: "update" },
        { el: "COMB_INFODOSAGEFORMCODE", label: "剤形コード情報", kind: "group", children: [
          { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
          { el: "COMB_DOSAGEFORMCODE", label: "剤形コード", kind: "value", status: "update" },
        ] },
      ] },
      { el: "COMB_MANUFACTMETHOD", label: "製造方法", kind: "value", status: "update", optional: true },
      { el: "COMB_INFOINTENDINDICATIONSEFFECTS", label: "予定される効能又は効果情報", kind: "group", optional: true, children: [
        { el: "COMB_INTENDINDICATIONSEFFECTS", label: "予定される効能又は効果", kind: "value", status: "update" },
        { el: "COMB_EFFICACYCLASSCODENUMBER", label: "薬効分類番号", kind: "value", status: "update" },
      ] },
      { el: "COMB_INFOINTENDDOSAGEADMIN", label: "予定される用法及び用量情報", kind: "group", optional: true, children: [
        { el: "COMB_INTENDDOSAGEADMIN", label: "予定される用法及び用量", kind: "value", status: "update" },
        { el: "COMB_INFOADMINROUTECODE", label: "投与経路コード情報", kind: "group", children: [
          { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
          { el: "COMB_ADMINROUTECODE", label: "投与経路コード", kind: "value", status: "update" },
        ] },
      ] },
      { el: "COMB_SUMMARYPROTOCOL", label: "", kind: "group", optional: true, children: [
        { el: "COMB_TARGETDISEASE", label: "対象疾患", kind: "value", status: "update" },
        { el: "COMB_INFODOSAGEADMIN", label: "用法及び用量情報", kind: "group", children: [
          { el: "COMB_DOSAGEADMIN", label: "用法及び用量", kind: "value", status: "update" },
          { el: "COMB_INFOADMINROUTECODE", label: "投与経路コード情報", kind: "group", children: [
            { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
            { el: "COMB_ADMINROUTECODE", label: "投与経路コード", kind: "value", status: "update" },
          ] },
        ] },
      ] },
      { el: "COMB_OTHERCOMMENTS", label: "", kind: "group", optional: true, children: [
        { el: "COMB_INFOCLINTRIALWITHDRUGCARTAGENA", label: "カルタヘナ法の対象となる薬物を用いる治験", kind: "group", children: [
          { el: "TYPECLINTRIALWITHDRUGCARTAGENA", label: "該当の有無等", kind: "value", status: "update" },
          { el: "DETAIL", label: "該当する場合の詳述", kind: "value", status: "update", optional: true },
        ] },
        { el: "COMB_INFOCLINTRIALWITHBIOLOGICALPROD", label: "生物由来製品に指定が見込まれる薬物を用いる治験", kind: "group", children: [
          { el: "TYPEBIOLOGICALPROD", label: "該当の有無等", kind: "value", status: "update" },
        ] },
        { el: "COMB_INFORESEARCHFORCODX", label: "対応するコンパニオン診断薬等の開発", kind: "group", children: [
          { el: "APPLICABLEORNOT", label: "該当の有無", kind: "value", status: "update" },
        ] },
        { el: "COMB_INFOCLINTRIALFORCOMBINATIONPROD", label: "コンビネーション製品に関する治験", kind: "group", children: [
          { el: "APPLICABLEORNOT", label: "該当の有無", kind: "value", status: "update" },
        ] },
        { el: "OTHERCOMMENTS", label: "その他", kind: "value", status: "update", optional: true },
      ] },
      { el: "COMB_INFOFOREIGNMANUFACTURER", label: "海外依頼者、外国製造業者に関する情報", kind: "group", optional: true, children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "COMB_FOREIGN_SPONSOR_NAME", label: "海外依頼者、外国製造業者の名称（邦文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_SPONSOR_REP_NAME", label: "海外依頼者、外国製造業者の(代表者の)氏名（邦文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_SPONSOR_ADDRESS1", label: "所在地１（邦文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_SPONSOR_ADDRESS2", label: "所在地２（邦文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_NAME_FRGNLNG", label: "海外依頼者、外国製造業者の名称（外国文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_SPOMSPR_REP_NAME_FRGNLNG", label: "海外依頼者、外国製造業者の(代表者の)氏名（外国文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_ADDRESS1_FRGNLNG", label: "所在地１（外国文）", kind: "value", status: "update" },
        { el: "COMB_FOREIGN_ADDRESS2_FRGNLNG", label: "所在地２（外国文）", kind: "value", status: "update" },
      ] },
      { el: "COMB_REMARKS", label: "その他備考", kind: "value", status: "update", optional: true },
      { el: "COMB_PRESENCEADRREPORT", label: "副作用報告の有無", kind: "value", status: "update" },
    ] },
  ] },
  { el: "INFOMEDICALINSTITUT", label: "実施医療機関情報", kind: "group", optional: true, children: [
    { el: "INFOEACHMEDICALINSTITUT", label: "実施医療機関ごとの事項", kind: "group", children: [
      { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
      { el: "INSTITUTE_NAME", label: "実施医療機関の名称", kind: "value", status: "update" },
      { el: "DEPARTMENT", label: "実施診療科", kind: "value", status: "update" },
      { el: "INSTITUTE_ADDRESS1", label: "所在地１", kind: "value", status: "update" },
      { el: "INSTITUTE_ADDRESS2", label: "所在地２", kind: "value", status: "update" },
      { el: "INSTITUTE_TELNUM", label: "電話番号", kind: "value", status: "update" },
      { el: "INFOINVESTIGATOR", label: "治験責任医師に関する情報", kind: "group", children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "CHIEFINVEST_NAME", label: "治験責任医師の氏名", kind: "value", status: "update" },
        { el: "NUMMEDICALSCHOOL", label: "大学番号", kind: "value", status: "update" },
        { el: "GRADUATYEARMEDICALSCHOOL", label: "卒業年", kind: "value", status: "update" },
        { el: "CHIEFINVEST_PRONOUNCE", label: "氏名よみかな", kind: "value", status: "update" },
      ] },
      { el: "INFOSUBINVESTIGATOR", label: "治験分担医師に関する情報", kind: "group", children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "INVESTIGATER_NAME", label: "治験分担医師の氏名", kind: "value", status: "update" },
        { el: "INVEST_PRONOUNCE", label: "氏名よみかな", kind: "value", status: "update" },
      ] },
      { el: "INFOQUANTITIESINVESTPRODUCT", label: "治験使用薬、治験使用機器相当、治験使用製品相当数量情報", kind: "group", children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "NAMEINVESTPRODUCT", label: "治験使用薬、治験使用機器相当、治験使用製品相当の名称", kind: "value", status: "update" },
        { el: "QUANTITIESPLANNED", label: "予定交付（入手）数量", kind: "value", status: "update" },
        { el: "QUANTITIESSUPPLIED", label: "交付数量", kind: "value", status: "update" },
        { el: "QUANTITIESUSED", label: "使用数量", kind: "value", status: "update" },
        { el: "QUANTITIESWITHDRAWN", label: "回収数量", kind: "value", status: "update" },
        { el: "QUANTITIESABROGATED", label: "廃棄数量", kind: "value", status: "update" },
      ] },
      { el: "PLANNUMSUBJMEDICALINSTUTUT", label: "実施医療機関予定被験者数", kind: "value", status: "update" },
      { el: "NUMSUBJENROLLINSTITUTION", label: "実施医療機関被験者数", kind: "value", status: "update" },
      { el: "INFOSMOINMEDINST", label: "治験の実施に関する業務の一部を実施医療機関から受託する者（治験施設支援機関（ＳＭＯ）等）の氏名、住所及び委託する業務の範囲", kind: "group", children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "SMO_NAME", label: "氏名", kind: "value", status: "update" },
        { el: "SMO_ADDRESS1", label: "住所１", kind: "value", status: "update" },
        { el: "SMO_ADDRESS2", label: "住所２", kind: "value", status: "update" },
        { el: "SMO_SERVICE", label: "委託する業務の範囲", kind: "value", status: "update" },
      ] },
      { el: "INFOIRB", label: "治験審査委員会に関する情報", kind: "group", children: [
        { el: "SERIALNO2", label: "順序番号", kind: "value", status: "add" },
        { el: "TYPEIRB", label: "院内・外部の区分", kind: "value", status: "update" },
        { el: "IRB_OWNER_NAME", label: "治験審査委員会の設置者の名称", kind: "value", status: "update" },
        { el: "IRB_ADDRESS1", label: "所在地１", kind: "value", status: "update" },
        { el: "IRB_ADDRESS2", label: "所在地２", kind: "value", status: "update" },
      ] },
      { el: "OTHERS", label: "その他", kind: "value", status: "update" },
    ] },
    { el: "FOOTNOTE", label: "脚注", kind: "value", status: "update" },
  ] },
  { el: "INFOREFCLINTRIALPLANNOTER", label: "参照する治験届出情報", kind: "group", optional: true, children: [
    { el: "SERIALNO1", label: "順序番号", kind: "value", status: "add" },
    { el: "REF_PRODUCTCATEGORY", label: "医薬品／医療機器／再生医療等製品の別", kind: "value", status: "update" },
    { el: "REF_INFOTESTSUBSTANCEIDCODE", label: "治験成分記号又は治験識別記号", kind: "value", status: "update" },
    { el: "REF_SERIALNOTENUM", label: "届出回数", kind: "value", status: "update" },
    { el: "TYPEREFFERENCE", label: "参照の区分", kind: "value", status: "update" },
    { el: "CONTENTS", label: "参照の詳細", kind: "value", status: "update" },
  ] },
];

/** 深さ優先で全ノードを走査する */
export function walkXsd(
  nodes: XsdNode[],
  visit: (node: XsdNode, path: XsdNode[]) => void,
  path: XsdNode[] = []
): void {
  for (const node of nodes) {
    visit(node, path);
    if (node.children) walkXsd(node.children, visit, [...path, node]);
  }
}

/** 要素名 → ノード（重複する要素名は最初に現れたもの） */
export const XSD_BY_ELEMENT: Record<string, XsdNode> = (() => {
  const map: Record<string, XsdNode> = {};
  walkXsd(XSD_FORM, (n) => {
    if (!map[n.el]) map[n.el] = n;
  });
  return map;
})();
