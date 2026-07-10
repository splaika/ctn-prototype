const ry = (b) => b.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
  N1 = (...b) =>
    b
      .filter((D, R, y) => !!D && D.trim() !== "" && y.indexOf(D) === R)
      .join(" ")
      .trim();
var gy = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
const by = St.forwardRef(
  (
    {
      color: b = "currentColor",
      size: D = 24,
      strokeWidth: R = 2,
      absoluteStrokeWidth: y,
      className: H = "",
      children: G,
      iconNode: j,
      ...Sl
    },
    B,
  ) =>
    St.createElement(
      "svg",
      {
        ref: B,
        ...gy,
        width: D,
        height: D,
        stroke: b,
        strokeWidth: y ? (Number(R) * 24) / Number(D) : R,
        className: N1("lucide", H),
        ...Sl,
      },
      [
        ...j.map(([A, F]) => St.createElement(A, F)),
        ...(Array.isArray(G) ? G : [G]),
      ],
    ),
);
const Et = (b, D) => {
  const R = St.forwardRef(({ className: y, ...H }, G) =>
    St.createElement(by, {
      ref: G,
      iconNode: D,
      className: N1(`lucide-${ry(b)}`, y),
      ...H,
    }),
  );
  return ((R.displayName = `${b}`), R);
};
const Sy = Et("Bell", [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi",
    },
  ],
]);
const R1 = Et("CircleCheck", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
]);
const Ey = Et("Database", [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }],
]);
const py = Et("FileInput", [
  [
    "path",
    { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", key: "1pf5j1" },
  ],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M2 15h10", key: "jfw4w8" }],
  ["path", { d: "m9 18 3-3-3-3", key: "112psh" }],
]);
const Kn = Et("FileText", [
  [
    "path",
    {
      d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
      key: "1rqfz7",
    },
  ],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }],
]);
const zy = Et("History", [
  [
    "path",
    { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" },
  ],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }],
]);
const Ty = Et("LayoutDashboard", [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  [
    "rect",
    { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" },
  ],
  [
    "rect",
    { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" },
  ],
  [
    "rect",
    { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" },
  ],
]);
const Ay = Et("PackageCheck", [
  ["path", { d: "m16 16 2 2 4-4", key: "gfu2re" }],
  [
    "path",
    {
      d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
      key: "e7tb2h",
    },
  ],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "12", key: "a4e8g8" }],
]);
const U1 = Et("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f",
    },
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
]);
const M1 = Et("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq",
    },
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }],
]);
const Dy = Et("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }],
]);
const Oy = Et("Workflow", [
    [
      "rect",
      { width: "8", height: "8", x: "3", y: "3", rx: "2", key: "by2w9f" },
    ],
    ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4", key: "xkn7yn" }],
    [
      "rect",
      { width: "8", height: "8", x: "13", y: "13", rx: "2", key: "1cgmvn" },
    ],
  ]),
  C1 = [
    {
      label: "ワークスペース",
      items: [
        {
          id: "dashboard",
          title: "ダッシュボード",
          icon: Ty,
          kicker: "Workspace",
          description:
            "期限候補、レビュー、取込確認、外字、出力エラーを横断して確認します。",
        },
        {
          id: "import",
          title: "既存データ取り込み",
          icon: py,
          kicker: "Import",
          description:
            "PDF/XMLから抽出した候補値を、出典ページ・信頼度・マスタ照合と一緒に確認します。",
        },
        {
          id: "submission",
          title: "届出作成",
          icon: Kn,
          kicker: "Authoring",
          description:
            "届出内容を章ごとに入力し、右側で差分・外字・PDF出力イメージを確認します。",
        },
        {
          id: "review",
          title: "レビュー・承認",
          icon: Oy,
          kicker: "Workflow",
          description:
            "入力完了から薬事確認、承認、出力準備までの状態と差戻しを管理します。",
        },
        {
          id: "output",
          title: "出力・提出準備",
          icon: Ay,
          kicker: "Output",
          description:
            "PDF/XML、XSD検証、添付資料、ファイル命名、提出パッケージを確認します。",
        },
      ],
    },
    {
      label: "マスタ管理",
      items: [
        {
          id: "masters",
          title: "マスタ管理",
          icon: Ey,
          kicker: "Master Data",
          description:
            "医師、医療機関、治験使用薬、届出者、CRO/SMO/IRB、添付資料を正本として管理します。",
        },
      ],
    },
    {
      label: "システム管理",
      items: [
        {
          id: "system",
          title: "システム管理",
          icon: U1,
          kicker: "System Rules",
          description:
            "XSDマッピング、コード、外字、期限、通知、権限、出力設定を管理します。",
        },
        {
          id: "audit",
          title: "履歴・監査",
          icon: zy,
          kicker: "Audit",
          description:
            "誰が、いつ、どの値を、どの根拠で確定したかを追跡します。",
        },
      ],
    },
  ],
  _1 = C1.flatMap((b) => b.items),
  My = [
    {
      task: "分担医師追加の変更届候補",
      trial: "CTN-03 試験薬C",
      source: "医師マスタ変更",
      baseDate: "2025-12-12",
      due: "2026-06-12",
      owner: "田中",
      status: "期限注意",
      tone: "danger",
    },
    {
      task: "PDF取込値の確認",
      trial: "CTN-08 試験薬H",
      source: "既存PDF 000270151",
      baseDate: "2026-06-18",
      due: "2026-06-25",
      owner: "佐藤",
      status: "取込確認",
      tone: "watch",
    },
    {
      task: "外字説明資料の承認",
      trial: "CTN-03 試験薬C",
      source: "渡邊/髙橋",
      baseDate: "2026-06-17",
      due: "2026-06-21",
      owner: "医学レビュー",
      status: "外字確認",
      tone: "watch",
    },
    {
      task: "XML XSDエラー修正",
      trial: "CTN-17 試験薬A",
      source: "出力検証",
      baseDate: "2026-06-19",
      due: "2026-06-19",
      owner: "薬事",
      status: "出力エラー",
      tone: "danger",
    },
  ],
  _y = [
    {
      field: "主たる被験薬の治験成分記号",
      value: "EI-A-001",
      page: "p.1",
      confidence: "高",
      map: "TESTSUBSTANCEIDCODE",
      master: "一致",
      action: "採用",
    },
    {
      field: "治験責任医師の氏名",
      value: "責任 一郎",
      page: "p.5",
      confidence: "高",
      map: "principalInvestigator.name",
      master: "候補あり",
      action: "確認",
    },
    {
      field: "治験分担医師の氏名",
      value: "渡邊 花子",
      page: "p.5",
      confidence: "中",
      map: "subInvestigators.name",
      master: "外字候補",
      action: "表記確認",
    },
    {
      field: "IRB設置者の名称",
      value: "■■法人▲▲会□□病院 ○山×郎",
      page: "p.31",
      confidence: "低",
      map: "irb.ownerName",
      master: "未登録",
      action: "新規候補",
    },
  ],
  Ke = [
    {
      id: "basic",
      title: "届出種別・基本情報",
      state: "入力済み",
      fields: [
        {
          label: "届出書種別",
          type: "select",
          value: "治験計画変更届書",
          options: [
            "治験計画届書",
            "治験計画変更届書",
            "治験終了届書",
            "治験中止届書",
            "開発中止届書",
          ],
          meta: "届出種別により必要章を制御",
        },
        {
          label: "届出年月日",
          type: "date",
          value: "2026-06-19",
          meta: "PDF先頭とXMLに出力",
        },
        {
          label: "提出先",
          value: "独立行政法人医薬品医療機器総合機構理事長 殿",
          meta: "届出種別に応じて候補表示",
        },
        {
          label: "様式等のバージョン情報",
          value: "医薬品治験届 令和2年8月改正版",
          meta: "出力テンプレート設定から反映",
        },
      ],
    },
    {
      id: "common",
      title: "治験届出共通事項",
      state: "入力済み",
      fields: [
        {
          label: "主たる被験薬の治験成分記号",
          value: "EI-A-001",
          meta: "TESTSUBSTANCEIDCODE / マスタ一致",
        },
        {
          label: "治験の種類",
          type: "select",
          value: "1",
          options: ["1", "2", "3"],
          meta: "コード選択",
        },
        {
          label: "主たる被験薬の初回届出受付番号",
          value: "2020-9001",
          meta: "初回届から参照",
        },
        {
          label: "主たる被験薬の初回届出年月日",
          type: "date",
          value: "2020-09-01",
          meta: "INITNOTEDATE",
        },
        {
          label: "主たる被験薬の届出回数",
          type: "number",
          value: "11",
          meta: "SERIALNOTENUM",
        },
        {
          label: "当該治験計画届出受付番号",
          value: "2026-1120",
          meta: "変更届受付後に確定",
        },
      ],
    },
    {
      id: "primary",
      title: "主たる被験薬",
      state: "確認中",
      issues: 1,
      fields: [
        {
          label: "届出分類",
          type: "select",
          value: "治験計画変更届",
          options: [
            "治験計画届",
            "治験計画変更届",
            "治験終了届",
            "治験中止届",
            "開発中止届",
          ],
          meta: "PDF章見出しに反映",
        },
        {
          label: "届出区分",
          type: "select",
          value: "1",
          options: ["1", "2", "3"],
          meta: "30日調査対象判定に使用",
        },
        {
          label: "30日調査対応被験薬区分",
          value: "新有効成分",
          meta: "コード・選択肢管理から候補表示",
        },
        {
          label: "製造所又は営業所の名称",
          value: "製薬協製薬株式会社 製剤研究所",
          meta: "製造所マスタ参照",
        },
        {
          label: "所在地1",
          value: "東京都中央区京橋2-1-1",
          meta: "住所表記チェック対象",
        },
        { label: "業者コード", value: "123456099", meta: "9桁チェック" },
        {
          label: "成分及び分量",
          type: "textarea",
          value: "1錠中にEI-A-001として10mg、20mg又は30mg含有する。",
          meta: "PDF p.1から取込 / 前回差分なし",
          wide: !0,
        },
        {
          label: "製造方法",
          type: "textarea",
          value: "化学合成したEI-A-001を日局製剤総則錠剤の項に準じて製造する。",
          meta: "長文欄 / PDFプレビューで折返し確認",
          wide: !0,
        },
      ],
    },
    {
      id: "protocol",
      title: "治験計画の概要",
      state: "入力中",
      issues: 2,
      fields: [
        {
          label: "実施計画書識別記号",
          value: "EI-A-001/00-001",
          meta: "PROTOCOLNUM",
        },
        {
          label: "開発の相",
          type: "select",
          value: "第I相",
          options: ["第I相", "第II相", "第III相", "製造販売後"],
          meta: "PHASECLINTRIAL",
        },
        { label: "試験の種類", value: "臨床薬理試験", meta: "TYPECLINTRIAL" },
        {
          label: "目的",
          type: "textarea",
          value:
            "健康成人男子志願者を対象としてEI-A-001の安全性および薬物動態について検討する。",
          meta: "PDF出力の長文確認",
          wide: !0,
        },
        {
          label: "予定被験者数（被験薬）",
          type: "number",
          value: "20",
          meta: "被験薬別人数",
        },
        {
          label: "予定被験者数（合計）",
          type: "number",
          value: "20",
          meta: "合計人数",
        },
        {
          label: "対象疾患",
          value: "健康成人男子志願者",
          meta: "TARGETDISEASE",
        },
        {
          label: "用法及び用量",
          type: "textarea",
          value: "EI-A-001 10mg、20mg、30mgを1日1回朝食後経口投与する。",
          meta: "投与経路コードと整合チェック",
          wide: !0,
        },
      ],
    },
    {
      id: "products",
      title: "治験使用薬等",
      state: "確認中",
      issues: 1,
      fields: [
        {
          label: "医薬品/医療機器/再生医療等製品の別",
          type: "select",
          value: "医薬品",
          options: ["医薬品", "医療機器", "再生医療等製品"],
          meta: "種別コード",
        },
        {
          label: "記号・名称等",
          value: "EI-F-001",
          meta: "主たる被験薬を除く治験使用薬",
        },
        {
          label: "記号・名称等の種類",
          type: "select",
          value: "治験成分記号",
          options: ["治験成分記号", "一般名", "販売名", "その他"],
          meta: "名称種別",
        },
        {
          label: "被験薬/対照薬/併用薬等の区別",
          type: "select",
          value: "被験薬",
          options: ["被験薬", "対照薬", "併用薬", "レスキュー薬", "その他"],
          meta: "区分情報",
        },
        {
          label: "国内における承認状況",
          type: "select",
          value: "未承認",
          options: ["未承認", "承認済", "適応外"],
          meta: "届出事項の条件分岐",
        },
        {
          label: "成分及び分量",
          type: "textarea",
          value: "1錠中にEI-F-001として20mg含有する。",
          meta: "複数行入力可能",
          wide: !0,
        },
      ],
    },
    {
      id: "sites",
      title: "実施医療機関",
      state: "入力中",
      issues: 3,
      fields: [
        {
          label: "実施医療機関の名称",
          value: "○○大学医学部附属病院",
          meta: "医療機関マスタ参照",
        },
        { label: "実施診療科", value: "第一内科", meta: "施設別項目" },
        { label: "所在地1", value: "○○県○○市○○町○番○号", meta: "住所1" },
        { label: "所在地2", value: "", meta: "任意" },
        { label: "電話番号", value: "012-345-6789", meta: "形式チェック" },
        {
          label: "実施医療機関予定被験者数",
          type: "number",
          value: "10",
          meta: "施設別人数",
        },
      ],
    },
    {
      id: "doctors",
      title: "医師情報",
      state: "要確認",
      issues: 2,
      fields: [
        {
          label: "治験責任医師の氏名",
          value: "治験 一郎",
          meta: "医師マスタ参照 / 変更差分あり",
        },
        { label: "大学番号", value: "830", meta: "大学番号一覧から候補" },
        { label: "卒業年", type: "number", value: "1962", meta: "西暦" },
        {
          label: "氏名よみかな",
          value: "ちけんいちろう",
          meta: "かなチェック",
        },
        {
          label: "治験分担医師の氏名",
          value: "髙橋 健",
          meta: "外字候補 / 届出用表記は高橋 健",
        },
        {
          label: "追加理由",
          type: "textarea",
          value:
            "前治験責任医師が院内人事により異動のため、分担医師を追加する。",
          meta: "変更届の理由欄候補",
          wide: !0,
        },
      ],
    },
    {
      id: "orgs",
      title: "CRO / SMO / IRB",
      state: "要確認",
      issues: 1,
      fields: [
        { label: "CRO氏名", value: "○○株式会社", meta: "CROマスタ参照" },
        {
          label: "CRO住所1",
          value: "東京都中央区日本橋1-1-1",
          meta: "住所変更差分チェック",
        },
        {
          label: "委託する業務の範囲",
          value: "モニタリング業務",
          meta: "契約書リンク確認",
        },
        {
          label: "IRB院内・外部の区分",
          type: "select",
          value: "外部IRB",
          options: ["院内IRB", "外部IRB"],
          meta: "IRB区分",
        },
        {
          label: "IRB設置者の名称",
          value: "■■法人▲▲会□□病院 ○山×郎",
          meta: "外字/記号チェック対象",
        },
        {
          label: "IRB所在地1",
          value: "大阪府大阪市中央区道修町6-1-1",
          meta: "出力対象",
        },
      ],
    },
    {
      id: "attachments",
      title: "添付資料・参照届出",
      state: "入力中",
      issues: 2,
      fields: [
        {
          label: "資料名1",
          value: "治験実施計画書（EI-A-001/00-001-3）",
          meta: "SharePoint添付資料マスタ参照",
        },
        {
          label: "資料名2",
          value: "インフォームド・コンセントに用いられる説明文書及び同意文書",
          meta: "必須資料候補",
        },
        {
          label: "外字説明資料",
          value: "gaiji_explanation.docx",
          meta: "未承認 / 出力前チェック対象",
        },
        {
          label: "参照する治験成分記号又は治験識別記号",
          value: "EH-A-001",
          meta: "参照届出情報",
        },
        { label: "届出回数", type: "number", value: "3", meta: "参照届出" },
        {
          label: "参照の詳細",
          type: "textarea",
          value: "前回変更届との差分比較対象として参照する。",
          meta: "必要時出力",
          wide: !0,
        },
      ],
    },
  ],
  Ny = [
    {
      type: "変更",
      item: "治験責任医師",
      before: "責任 一郎",
      after: "治験 一郎",
      decision: "届出対象",
      reason: "院内人事による変更",
    },
    {
      type: "追加",
      item: "分担医師",
      before: "-",
      after: "髙橋 健",
      decision: "期限候補",
      reason: "追加日から6か月以内候補",
    },
    {
      type: "表記",
      item: "分担医師",
      before: "渡邊 花子",
      after: "渡辺 花子",
      decision: "外字確認",
      reason: "届出用表記へ置換",
    },
    {
      type: "資料",
      item: "治験実施計画書",
      before: "v2.0",
      after: "v3.0",
      decision: "添付更新",
      reason: "版更新",
    },
  ],
  rf = [
    {
      id: "doctor",
      title: "医師マスタ",
      description:
        "責任医師・分担医師・調整医師を同じ正本で管理し、届出ごとの役割と変更イベントに展開します。",
      fields: [
        { label: "医師ID", value: "DR-014" },
        { label: "原表記氏名", value: "髙橋 健" },
        { label: "届出用表記", value: "高橋 健" },
        { label: "氏名よみかな", value: "たかはしけん" },
        { label: "大学番号", value: "830" },
        { label: "卒業年", type: "number", value: "1998" },
        { label: "所属機関", value: "東京中央病院 循環器内科" },
        {
          label: "外字扱い",
          type: "select",
          value: "置換承認済み",
          options: ["なし", "要確認", "置換承認済み", "説明資料出力"],
        },
      ],
    },
    {
      id: "site",
      title: "医療機関マスタ",
      description:
        "施設、診療科、所在地、代表電話、責任医師、IRB/SMO紐づけを管理します。",
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
      description:
        "主たる被験薬、対照薬、併用薬、レスキュー薬の記号・名称・区分・コード・数量単位を管理します。",
      fields: [
        { label: "薬剤ID", value: "DRUG-001" },
        { label: "記号・名称等", value: "EI-A-001 10mg錠" },
        {
          label: "名称等の種類",
          type: "select",
          value: "治験成分記号",
          options: ["治験成分記号", "一般名", "販売名", "その他"],
        },
        {
          label: "区分",
          type: "select",
          value: "主たる被験薬",
          options: [
            "主たる被験薬",
            "被験薬",
            "対照薬",
            "併用薬",
            "レスキュー薬",
          ],
        },
        { label: "剤形コード", value: "A1" },
        { label: "投与経路コード", value: "11" },
        { label: "数量単位", value: "錠" },
        {
          label: "国内承認状況",
          type: "select",
          value: "未承認",
          options: ["未承認", "承認済", "適応外"],
        },
      ],
    },
    {
      id: "applicant",
      title: "届出者・依頼者マスタ",
      description:
        "届出者、代表者、所在地、業者コード、担当者、海外依頼者情報を管理します。",
      fields: [
        {
          label: "届出者の種別",
          type: "select",
          value: "治験依頼者",
          options: ["治験依頼者", "自ら治験を実施する者"],
        },
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
      description:
        "委託先、施設支援機関、IRB設置者の名称・住所・委託範囲を管理します。",
      fields: [
        { label: "組織ID", value: "ORG-022" },
        {
          label: "種別",
          type: "select",
          value: "CRO",
          options: ["CRO", "SMO", "IRB"],
        },
        { label: "名称", value: "○○株式会社" },
        { label: "住所1", value: "東京都中央区日本橋1-1-1" },
        { label: "住所2", value: "○○ビル" },
        { label: "委託する業務の範囲", value: "モニタリング業務" },
        {
          label: "IRB院内・外部区分",
          type: "select",
          value: "外部IRB",
          options: ["院内IRB", "外部IRB"],
        },
        {
          label: "変更時の届出要否",
          type: "select",
          value: "要判定",
          options: ["要判定", "届出候補", "対象外"],
        },
      ],
    },
    {
      id: "attachment",
      title: "添付資料マスタ",
      description:
        "資料名、版、届出種別ごとの必須条件、SharePoint保管先を管理します。",
      fields: [
        { label: "資料ID", value: "DOC-010" },
        { label: "資料名", value: "治験実施計画書（EI-A-001/00-001-3）" },
        { label: "版", value: "v3.0" },
        {
          label: "資料種別",
          type: "select",
          value: "治験実施計画書",
          options: [
            "治験実施計画書",
            "IB",
            "ICF",
            "CRF",
            "外字説明資料",
            "その他",
          ],
        },
        { label: "必須条件", value: "治験計画届/変更届で添付候補" },
        {
          label: "SharePoint保管先",
          value: "Attachments/CTN-03/protocol_v3.pdf",
        },
        {
          label: "承認状態",
          type: "select",
          value: "承認済み",
          options: ["下書き", "レビュー中", "承認済み", "差戻し"],
        },
        {
          label: "出力対象",
          type: "select",
          value: "対象",
          options: ["対象", "対象外"],
        },
      ],
    },
  ],
  Ry = {
    doctor: [
      {
        id: "DR-014",
        name: "髙橋 健",
        sub: "東京中央病院 循環器内科",
        status: "外字承認済み",
        updated: "2026-06-18",
        values: {
          医師ID: "DR-014",
          原表記氏名: "髙橋 健",
          届出用表記: "高橋 健",
          氏名よみかな: "たかはしけん",
          大学番号: "830",
          卒業年: "1998",
          所属機関: "東京中央病院 循環器内科",
          外字扱い: "置換承認済み",
        },
      },
      {
        id: "DR-022",
        name: "渡邊 花子",
        sub: "大阪北医療センター 消化器内科",
        status: "説明資料候補",
        updated: "2026-06-17",
        values: {
          医師ID: "DR-022",
          原表記氏名: "渡邊 花子",
          届出用表記: "渡辺 花子",
          氏名よみかな: "わたなべはなこ",
          大学番号: "732",
          卒業年: "2004",
          所属機関: "大阪北医療センター 消化器内科",
          外字扱い: "説明資料出力",
        },
      },
      {
        id: "DR-031",
        name: "治験 一郎",
        sub: "○○大学医学部附属病院 第一内科",
        status: "通常表記",
        updated: "2026-06-12",
        values: {
          医師ID: "DR-031",
          原表記氏名: "治験 一郎",
          届出用表記: "治験 一郎",
          氏名よみかな: "ちけんいちろう",
          大学番号: "830",
          卒業年: "1962",
          所属機関: "○○大学医学部附属病院 第一内科",
          外字扱い: "なし",
        },
      },
    ],
    site: [
      {
        id: "SITE-001",
        name: "○○大学医学部附属病院",
        sub: "第一内科",
        status: "実施中",
        updated: "2026-06-10",
        values: {
          施設ID: "SITE-001",
          実施医療機関の名称: "○○大学医学部附属病院",
          実施診療科: "第一内科",
          所在地1: "○○県○○市○○町○番○号",
          所在地2: "",
          電話番号: "012-345-6789",
          標準責任医師: "治験 一郎",
          紐づくIRB: "外部IRB: ■■法人▲▲会□□病院",
        },
      },
      {
        id: "SITE-002",
        name: "東京中央病院",
        sub: "循環器内科",
        status: "責任医師変更候補",
        updated: "2026-06-08",
        values: {
          施設ID: "SITE-002",
          実施医療機関の名称: "東京中央病院",
          実施診療科: "循環器内科",
          所在地1: "東京都千代田区1-1-1",
          所在地2: "中央メディカル棟",
          電話番号: "03-1234-5678",
          標準責任医師: "山田 太郎",
          紐づくIRB: "院内IRB: 東京中央病院治験審査委員会",
        },
      },
      {
        id: "SITE-003",
        name: "大阪北医療センター",
        sub: "消化器内科",
        status: "外字確認あり",
        updated: "2026-06-05",
        values: {
          施設ID: "SITE-003",
          実施医療機関の名称: "大阪北医療センター",
          実施診療科: "消化器内科",
          所在地1: "大阪府大阪市北区2-2-2",
          所在地2: "",
          電話番号: "06-9876-5432",
          標準責任医師: "渡辺 花子",
          紐づくIRB: "外部IRB: 大阪北IRB",
        },
      },
    ],
    product: [
      {
        id: "DRUG-001",
        name: "EI-A-001 10mg錠",
        sub: "主たる被験薬",
        status: "未承認",
        updated: "2026-06-16",
        values: {
          薬剤ID: "DRUG-001",
          "記号・名称等": "EI-A-001 10mg錠",
          名称等の種類: "治験成分記号",
          区分: "主たる被験薬",
          剤形コード: "A1",
          投与経路コード: "11",
          数量単位: "錠",
          国内承認状況: "未承認",
        },
      },
      {
        id: "DRUG-002",
        name: "EI-F-001 20mg錠",
        sub: "被験薬",
        status: "数量確認",
        updated: "2026-06-14",
        values: {
          薬剤ID: "DRUG-002",
          "記号・名称等": "EI-F-001 20mg錠",
          名称等の種類: "治験成分記号",
          区分: "被験薬",
          剤形コード: "A1",
          投与経路コード: "11",
          数量単位: "錠",
          国内承認状況: "未承認",
        },
      },
      {
        id: "DRUG-003",
        name: "プラセボ錠",
        sub: "対照薬",
        status: "承認済み",
        updated: "2026-05-29",
        values: {
          薬剤ID: "DRUG-003",
          "記号・名称等": "プラセボ錠",
          名称等の種類: "その他",
          区分: "対照薬",
          剤形コード: "A1",
          投与経路コード: "11",
          数量単位: "錠",
          国内承認状況: "適応外",
        },
      },
    ],
    applicant: [
      {
        id: "APP-001",
        name: "製薬協製薬株式会社",
        sub: "治験依頼者",
        status: "有効",
        updated: "2026-06-01",
        values: {
          届出者の種別: "治験依頼者",
          届出者の名称: "製薬協製薬株式会社",
          代表者の氏名: "代表取締役社長 日本 太郎",
          所在地1: "東京都中央区京橋1-1-1",
          所在地2: "京橋中央ビル",
          業者コード: "123456000",
          担当者の氏名: "薬事 亮",
          FAX番号又はメールアドレス: "ra@example.co.jp",
        },
      },
      {
        id: "APP-002",
        name: "Global Sponsor Inc.",
        sub: "海外依頼者",
        status: "住所確認",
        updated: "2026-05-20",
        values: {
          届出者の種別: "治験依頼者",
          届出者の名称: "Global Sponsor Inc.",
          代表者の氏名: "John Smith",
          所在地1: "1-1 Nihonbashi, Chuo-ku, Tokyo",
          所在地2: "",
          業者コード: "987654000",
          担当者の氏名: "薬事 亮",
          FAX番号又はメールアドレス: "global-ra@example.com",
        },
      },
    ],
    org: [
      {
        id: "ORG-022",
        name: "○○株式会社",
        sub: "CRO / モニタリング業務",
        status: "契約中",
        updated: "2026-06-11",
        values: {
          組織ID: "ORG-022",
          種別: "CRO",
          名称: "○○株式会社",
          住所1: "東京都中央区日本橋1-1-1",
          住所2: "○○ビル",
          委託する業務の範囲: "モニタリング業務",
          "IRB院内・外部区分": "外部IRB",
          変更時の届出要否: "要判定",
        },
      },
      {
        id: "ORG-030",
        name: "CTN Site Support",
        sub: "SMO / 治験支援業務",
        status: "住所変更候補",
        updated: "2026-06-09",
        values: {
          組織ID: "ORG-030",
          種別: "SMO",
          名称: "CTN Site Support",
          住所1: "東京都港区3-3-3",
          住所2: "Site Support Tower",
          委託する業務の範囲: "治験支援業務",
          "IRB院内・外部区分": "外部IRB",
          変更時の届出要否: "届出候補",
        },
      },
      {
        id: "ORG-041",
        name: "■■法人▲▲会□□病院",
        sub: "IRB / 外部IRB",
        status: "外字確認",
        updated: "2026-06-06",
        values: {
          組織ID: "ORG-041",
          種別: "IRB",
          名称: "■■法人▲▲会□□病院",
          住所1: "大阪府大阪市中央区道修町6-1-1",
          住所2: "○□ビル",
          委託する業務の範囲: "治験審査",
          "IRB院内・外部区分": "外部IRB",
          変更時の届出要否: "要判定",
        },
      },
    ],
    attachment: [
      {
        id: "DOC-010",
        name: "治験実施計画書",
        sub: "v3.0 / PDF",
        status: "承認済み",
        updated: "2026-06-15",
        values: {
          資料ID: "DOC-010",
          資料名: "治験実施計画書（EI-A-001/00-001-3）",
          版: "v3.0",
          資料種別: "治験実施計画書",
          必須条件: "治験計画届/変更届で添付候補",
          SharePoint保管先: "Attachments/CTN-03/protocol_v3.pdf",
          承認状態: "承認済み",
          出力対象: "対象",
        },
      },
      {
        id: "DOC-018",
        name: "外字説明資料",
        sub: "v1.0 / docx",
        status: "レビュー中",
        updated: "2026-06-18",
        values: {
          資料ID: "DOC-018",
          資料名: "外字説明資料",
          版: "v1.0",
          資料種別: "外字説明資料",
          必須条件: "外字置換がある場合に添付候補",
          SharePoint保管先: "Attachments/CTN-03/gaiji_explanation.docx",
          承認状態: "レビュー中",
          出力対象: "対象",
        },
      },
    ],
  };
function Uy() {
  const [b, D] = St.useState("dashboard"),
    R = St.useMemo(() => _1.find((y) => y.id === b) ?? _1[0], [b]);
  return f.createElement(
    "div",
    { className: "ctn-shell" },
    f.createElement(
      "aside",
      { className: "side-nav" },
      f.createElement(
        "div",
        { className: "brand" },
        f.createElement("span", null, "CTN"),
        f.createElement(
          "div",
          null,
          f.createElement("strong", null, "治験届管理"),
          f.createElement("small", null, "作成・確認・提出準備"),
        ),
      ),
      f.createElement(
        "nav",
        null,
        C1.map((y) =>
          f.createElement(
            "section",
            { key: y.label, className: "nav-group" },
            f.createElement("p", null, y.label),
            y.items.map((H) => {
              const G = H.icon;
              return f.createElement(
                "button",
                {
                  key: H.id,
                  className: b === H.id ? "active" : "",
                  onClick: () => D(H.id),
                },
                f.createElement(G, { size: 16 }),
                f.createElement("span", null, H.title),
              );
            }),
          ),
        ),
      ),
    ),
    f.createElement(
      "main",
      { className: "workspace" },
      f.createElement(
        "header",
        { className: "topbar" },
        f.createElement(
          "div",
          null,
          f.createElement("small", null, R.kicker),
          f.createElement("h1", null, R.title),
        ),
        f.createElement(
          "div",
          { className: "toolbar" },
          f.createElement(
            "button",
            { className: "ghost-button" },
            f.createElement(Sy, { size: 16 }),
            "通知",
          ),
          f.createElement(
            "button",
            { className: "primary-button" },
            f.createElement(R1, { size: 16 }),
            "レビュー用に保存",
          ),
        ),
      ),
      Cy(b, D),
    ),
  );
}
function Cy(b, D) {
  return b === "dashboard"
    ? f.createElement(Hy, { setActiveId: D })
    : b === "import"
      ? f.createElement(By, { setActiveId: D })
      : b === "submission"
        ? f.createElement(qy, null)
        : b === "review"
          ? f.createElement(Yy, null)
          : b === "output"
            ? f.createElement(Xy, null)
            : b === "masters"
              ? f.createElement(Gy, null)
              : b === "system"
                ? f.createElement(Qy, null)
                : f.createElement(jy, null);
}
function Hy({ setActiveId: b }) {
  return f.createElement(
    "div",
    { className: "page-grid" },
    f.createElement(
      "div",
      { className: "metric-strip" },
      f.createElement(Du, {
        label: "期限注意",
        value: "5",
        tone: "danger",
        note: "マスタ変更から算出",
      }),
      f.createElement(Du, {
        label: "レビュー待ち",
        value: "8",
        tone: "watch",
        note: "一次/薬事/QA",
      }),
      f.createElement(Du, {
        label: "取込未確認",
        value: "3",
        note: "PDF抽出候補",
      }),
      f.createElement(Du, {
        label: "外字確認",
        value: "2",
        tone: "watch",
        note: "説明資料候補",
      }),
      f.createElement(Du, {
        label: "出力エラー",
        value: "1",
        tone: "danger",
        note: "XSD検証",
      }),
    ),
    f.createElement(
      "section",
      { className: "panel" },
      f.createElement(Xl, {
        tag: "Priority Queue",
        title: "今対応すべき届出・確認事項",
        text: "期限候補、レビュー、取込、外字、出力検証を同じキューに集約します。",
      }),
      f.createElement(It, {
        headers: [
          "タスク",
          "対象試験",
          "発生元",
          "起算日",
          "期限候補",
          "担当",
          "状態",
        ],
        rows: My.map((D) => [
          D.task,
          D.trial,
          D.source,
          D.baseDate,
          D.due,
          D.owner,
          f.createElement("span", { className: `pill ${D.tone}` }, D.status),
        ]),
      }),
    ),
  );
}
function By({ setActiveId: b }) {
  return f.createElement(
    "div",
    { className: "page-grid" },
    f.createElement(
      "section",
      { className: "panel import-layout" },
      f.createElement(
        "div",
        null,
        f.createElement(Xl, {
          tag: "Import Review",
          title: "既存PDF取り込み",
          text: "ここで扱うPDFは最終出力ではなく、抽出値の出典確認用の原本です。候補値、出典ページ、信頼度、マッピング、マスタ照合を確認します。",
        }),
        f.createElement(
          "div",
          { className: "upload-box" },
          f.createElement(Dy, { size: 22 }),
          f.createElement("strong", null, "000270151.pdf"),
          f.createElement(
            "span",
            null,
            "33ページ / テキスト抽出済み / OCR補完 4項目",
          ),
        ),
        f.createElement(It, {
          headers: [
            "抽出項目",
            "抽出値",
            "出典",
            "信頼度",
            "マッピング先",
            "マスタ照合",
            "処理",
          ],
          rows: _y.map((D) => [
            D.field,
            D.value,
            D.page,
            D.confidence,
            D.map,
            D.master,
            D.action,
          ]),
        }),
      ),
      f.createElement(Vy, null),
    ),
    f.createElement(
      "section",
      { className: "panel" },
      f.createElement(Xl, {
        tag: "Pipeline",
        title: "ドラフト反映までの確認ステップ",
        text: "抽出候補は正本ではなく、レビュー済みの確定値だけが届出ドラフトへ入ります。",
      }),
      f.createElement(B1, {
        steps: [
          "原本保存",
          "OCR/抽出",
          "項目マッピング",
          "マスタ照合",
          "人手確認",
          "ドラフト反映",
        ],
      }),
      f.createElement(
        "button",
        { className: "primary-button", onClick: () => b("submission") },
        f.createElement(Kn, { size: 16 }),
        "届出ドラフトへ反映",
      ),
    ),
  );
}
function qy() {
  const [b, D] = St.useState("basic"),
    [R, y] = St.useState("check"),
    H = Ke.findIndex((j) => j.id === b),
    G = Ke[H] ?? Ke[0];
  return f.createElement(
    "section",
    { className: "authoring" },
    f.createElement(
      "aside",
      { className: "chapter-list" },
      f.createElement("h2", null, "届出作成"),
      Ke.map((j) =>
        f.createElement(
          "button",
          {
            key: j.id,
            className: `${j.issues ? "has-issue" : ""} ${j.id === G.id ? "selected" : ""}`,
            onClick: () => D(j.id),
          },
          f.createElement("span", null, j.title),
          f.createElement(
            "small",
            null,
            j.state,
            j.issues ? ` / ${j.issues}件` : "",
          ),
        ),
      ),
    ),
    f.createElement(
      "main",
      { className: "editor-panel" },
      f.createElement(Xl, {
        tag: "Submission Fields",
        title: G.title,
        text: "届出作成中はPDFを見る画面ではなく、入力値、必須チェック、マスタ参照、差分、外字を確認する作業画面として扱います。",
      }),
      f.createElement(
        "div",
        { className: "field-grid" },
        G.fields.map((j) => f.createElement(H1, { key: j.label, field: j })),
      ),
      f.createElement(
        "div",
        { className: "form-actions" },
        f.createElement(
          "button",
          {
            className: "ghost-button",
            disabled: H === 0,
            onClick: () => D(Ke[H - 1].id),
          },
          "前の章",
        ),
        f.createElement(
          "button",
          {
            className: "primary-button",
            onClick: () => D(Ke[Math.min(H + 1, Ke.length - 1)].id),
          },
          "次の章へ",
        ),
      ),
    ),
    f.createElement(
      "aside",
      { className: "inspector" },
      f.createElement(
        "div",
        { className: "tabs" },
        [
          ["check", "チェック"],
          ["diff", "差分"],
          ["gaiji", "外字"],
          ["master", "マスタ参照"],
        ].map(([j, Sl]) =>
          f.createElement(
            "button",
            { key: j, className: R === j ? "active" : "", onClick: () => y(j) },
            Sl,
          ),
        ),
      ),
      R === "check" && f.createElement(Zy, { chapter: G }),
      R === "diff" && f.createElement(Y1, { compact: !0 }),
      R === "gaiji" && f.createElement(xy, null),
      R === "master" && f.createElement(Ly, { chapter: G }),
    ),
  );
}
function Yy() {
  return f.createElement(
    "div",
    { className: "page-grid" },
    f.createElement(
      "section",
      { className: "panel" },
      f.createElement(Xl, {
        tag: "Workflow",
        title: "レビュー・承認ワークフロー",
        text: "届出種別ごとに承認ルートを設定し、差戻し理由、コメント、電子承認ログを保存します。",
      }),
      f.createElement(
        "div",
        { className: "workflow-bar" },
        [
          "下書き",
          "入力完了",
          "一次レビュー",
          "薬事確認",
          "承認待ち",
          "出力準備",
        ].map((b, D) =>
          f.createElement(
            "article",
            { key: b, className: D < 3 ? "done" : D === 3 ? "current" : "" },
            f.createElement("span", null, D + 1),
            f.createElement("strong", null, b),
            f.createElement(
              "small",
              null,
              D === 3 ? "未完了チェック 4件" : D < 3 ? "完了" : "待機中",
            ),
          ),
        ),
      ),
    ),
    f.createElement(
      "section",
      { className: "panel" },
      f.createElement(Xl, {
        tag: "Review Queue",
        title: "レビュー対象",
        text: "差分、外字、添付不足、XSDエラーをレビュー観点として提示します。",
      }),
      f.createElement(Y1, null),
    ),
    f.createElement(
      "section",
      { className: "panel review-artifact" },
      f.createElement(
        "div",
        null,
        f.createElement(Xl, {
          tag: "Approved Artifact",
          title: "承認後に確認する固定版PDF",
          text: "入力途中の画面ではPDFを常設せず、ワークフローで承認された版、または承認直前に固定したレビュー版だけをPDFとして確認します。",
        }),
        f.createElement(
          "div",
          { className: "check-grid" },
          f.createElement(bt, {
            title: "承認版PDF",
            status: "承認待ち",
            detail: "薬事確認後に固定版を生成",
            tone: "watch",
          }),
          f.createElement(bt, {
            title: "固定版XML",
            status: "未生成",
            detail: "承認後にXMLとXSD検証を実行",
          }),
        ),
      ),
      f.createElement(X1, { title: "承認後PDFビュー", compact: !0 }),
    ),
  );
}
function Xy() {
  return f.createElement(
    "section",
    { className: "panel output-layout" },
    f.createElement(
      "div",
      null,
      f.createElement(Xl, {
        tag: "Output Package",
        title: "PDF/XML提出準備",
        text: "承認済みの届出ドラフトから、PDF、XML、添付資料、ファイル命名、XSD検証を一括確認します。",
      }),
      f.createElement(
        "div",
        { className: "check-grid" },
        f.createElement(bt, {
          title: "PDF生成",
          status: "完了",
          detail: "出力イメージと章構成を確認済み",
        }),
        f.createElement(bt, {
          title: "XML生成",
          status: "警告あり",
          detail: "投与経路コード 1件確認待ち",
          tone: "watch",
        }),
        f.createElement(bt, {
          title: "XSD検証",
          status: "エラー 1件",
          detail: "必須項目未入力",
          tone: "danger",
        }),
        f.createElement(bt, {
          title: "添付資料",
          status: "不足 1件",
          detail: "外字説明資料が未承認",
          tone: "watch",
        }),
      ),
      f.createElement(It, {
        headers: ["出力物", "ファイル名", "状態", "確認者"],
        rows: [
          ["届出PDF", "CTN-03_change_011.pdf", "生成済み", "薬事"],
          ["届出XML", "CTN-03_change_011.xml", "検証中", "システム"],
          ["添付資料ZIP", "CTN-03_attachments.zip", "不足あり", "田中"],
        ],
      }),
    ),
    f.createElement(X1, { title: "PDF最終確認" }),
  );
}
function Gy() {
  const [b, D] = St.useState("doctor"),
    [R, y] = St.useState({}),
    H = rf.find((O) => O.id === b) ?? rf[0],
    G = Ry[H.id] ?? [],
    j = R[H.id] ?? G[0]?.id,
    Sl = G.find((O) => O.id === j) ?? G[0],
    B = H.fields.map((O) => ({
      ...O,
      value: Sl?.values?.[O.label] ?? O.value,
    }));
  function A(O) {
    D(O);
  }
  function F(O) {
    y((ml) => ({ ...ml, [H.id]: O }));
  }
  return f.createElement(
    "section",
    { className: "master-layout" },
    f.createElement(
      "aside",
      { className: "master-menu" },
      f.createElement("h2", null, "マスタ種別"),
      rf.map((O) =>
        f.createElement(
          "button",
          {
            key: O.id,
            className: O.id === H.id ? "selected" : "",
            onClick: () => A(O.id),
          },
          f.createElement("span", null, O.title),
          f.createElement("small", null, O.description),
        ),
      ),
    ),
    f.createElement(
      "main",
      { className: "master-workspace" },
      f.createElement(
        "section",
        { className: "panel" },
        f.createElement(Xl, {
          tag: "Master Records",
          title: `${H.title} 一覧`,
          text: "登録済みの正本データを一覧で確認し、編集対象を選択します。変更イベントはこの一覧の更新から発生します。",
        }),
        f.createElement(It, {
          headers: ["ID", "名称", "補足", "状態", "最終更新", "操作"],
          rows: G.map((O) => [
            O.id,
            O.name,
            O.sub,
            O.status,
            O.updated,
            f.createElement(
              "button",
              { className: "link-button", onClick: () => F(O.id) },
              O.id === Sl?.id ? "編集中" : "編集",
            ),
          ]),
        }),
      ),
      f.createElement(
        "section",
        { className: "panel" },
        f.createElement(Xl, {
          tag: "Master Form",
          title: `${Sl?.name ?? H.title} の入力内容`,
          text: "一覧で選択したレコードの入力フィールドです。ここで更新した内容が、届出作成時の参照値や変更届候補の発生元になります。",
        }),
        f.createElement(
          "div",
          { className: "field-grid" },
          B.map((O) =>
            f.createElement(H1, { key: `${Sl?.id}-${O.label}`, field: O }),
          ),
        ),
        f.createElement(
          "div",
          { className: "form-actions" },
          f.createElement(
            "button",
            { className: "ghost-button" },
            "変更履歴を見る",
          ),
          f.createElement(
            "button",
            { className: "primary-button" },
            "マスタを保存",
          ),
        ),
      ),
      f.createElement(
        "section",
        { className: "sub-panel" },
        f.createElement("h3", null, "変更イベント化の例"),
        f.createElement(It, {
          headers: ["変更内容", "起算日", "届出候補", "確認状態"],
          rows: [
            [
              "氏名/住所/区分などの変更",
              "変更発生日",
              "変更届候補を生成",
              "薬事確認待ち",
            ],
            [
              "新規追加",
              "登録日または契約日",
              "届出要否を判定",
              "担当者確認済み",
            ],
          ],
        }),
      ),
    ),
  );
}
function Qy() {
  return f.createElement(
    "div",
    { className: "page-grid" },
    f.createElement(
      "section",
      { className: "panel" },
      f.createElement(Xl, {
        tag: "System Rules",
        title: "設定可能にするルール",
        text: "業務ルールはコード固定にせず、管理者が保守できる設定として切り出します。",
      }),
      f.createElement(
        "div",
        { className: "settings-grid" },
        f.createElement(bt, {
          title: "XSD項目・出力マッピング",
          status: "管理者設定",
          detail: "画面項目とXML要素、PDF表示位置を対応",
        }),
        f.createElement(bt, {
          title: "コード・選択肢",
          status: "管理者設定",
          detail: "剤形、投与経路、薬効分類、届出区分",
        }),
        f.createElement(bt, {
          title: "外字・表記ゆれ",
          status: "承認履歴",
          detail: "原表記、届出用表記、説明資料要否",
        }),
        f.createElement(bt, {
          title: "通知・期限ルール",
          status: "ユーザー設定可",
          detail: "90/60/30/14/7日前、超過時の通知",
        }),
        f.createElement(bt, {
          title: "権限・ロール",
          status: "Entra ID連携",
          detail: "担当者、レビュー、承認者、管理者",
        }),
        f.createElement(bt, {
          title: "出力テンプレート",
          status: "版管理",
          detail: "PDF/XML、命名規則、提出パッケージ",
        }),
      ),
    ),
    f.createElement(
      "section",
      { className: "panel" },
      f.createElement(Xl, {
        tag: "Reminder",
        title: "リマインド設定例",
        text: "標準ルールに加えて、ユーザー単位で通知タイミングと通知チャネルを調整できます。",
      }),
      f.createElement(q1, null),
    ),
  );
}
function jy() {
  return f.createElement(
    "section",
    { className: "panel" },
    f.createElement(Xl, {
      tag: "Audit Trail",
      title: "履歴・監査",
      text: "取り込み、マスタ照合、置換、レビュー、承認、出力のすべてを監査ログとして残します。",
    }),
    f.createElement(It, {
      headers: ["日時", "操作", "対象", "実施者", "根拠"],
      rows: [
        [
          "2026-06-19 09:10",
          "PDF抽出候補を採用",
          "主たる被験薬の治験成分記号",
          "田中",
          "000270151.pdf p.1",
        ],
        [
          "2026-06-19 10:22",
          "外字置換を承認",
          "髙橋 健 -> 高橋 健",
          "医学レビュー",
          "外字ルール G-004",
        ],
        [
          "2026-06-19 14:05",
          "差戻し",
          "XSD必須項目",
          "QA",
          "投与経路コード未入力",
        ],
      ],
    }),
  );
}
function H1({ field: b }) {
  return f.createElement(
    "label",
    { className: `field ${b.wide ? "wide" : ""}` },
    f.createElement("span", null, b.label),
    b.type === "select"
      ? f.createElement(
          "select",
          { defaultValue: b.value },
          b.options.map((D) => f.createElement("option", { key: D }, D)),
        )
      : b.type === "textarea"
        ? f.createElement("textarea", { defaultValue: b.value })
        : f.createElement("input", {
            type: b.type || "text",
            defaultValue: b.value,
          }),
    f.createElement("small", null, b.meta || "マスタ入力フィールド"),
  );
}
function Xl({ tag: b, title: D }) {
  return f.createElement(
    "div",
    { className: "section-title" },
    f.createElement(
      "div",
      null,
      f.createElement("span", { className: "tag" }, b),
      f.createElement("h2", null, D),
    ),
  );
}
function Du({ label: b, value: D, note: R, tone: y }) {
  return f.createElement(
    "article",
    { className: `metric ${y || ""}` },
    f.createElement("span", null, b),
    f.createElement("strong", null, D),
    f.createElement("small", null, R),
  );
}
function B1({ steps: b }) {
  return f.createElement(
    "div",
    { className: "flow" },
    b.map((D, R) =>
      f.createElement(
        "article",
        { key: D },
        f.createElement("span", null, R + 1),
        f.createElement("strong", null, D),
      ),
    ),
  );
}
function q1() {
  return f.createElement(
    "div",
    { className: "rule-list" },
    f.createElement(
      "article",
      null,
      f.createElement("strong", null, "分担医師 追加/削除/氏名変更"),
      f.createElement(
        "span",
        null,
        "起算日: 変更日 / 期限候補: 1年以内 / 通知: 90, 30, 7日前",
      ),
    ),
    f.createElement(
      "article",
      null,
      f.createElement("strong", null, "CRO/SMO/IRB 変更"),
      f.createElement(
        "span",
        null,
        "起算日: 契約・変更発生日 / 期限候補: 6か月以内 / 通知: 60, 30, 14日前",
      ),
    ),
    f.createElement(
      "article",
      null,
      f.createElement("strong", null, "出力前チェック"),
      f.createElement(
        "span",
        null,
        "PDF/XML生成時 / XSDエラー、添付不足、外字未承認を即時通知",
      ),
    ),
  );
}
function Zy({ chapter: b }) {
  return f.createElement(
    "div",
    { className: "mini-panel" },
    f.createElement("h3", null, "チェック結果"),
    f.createElement(
      "ul",
      null,
      f.createElement(
        "li",
        null,
        f.createElement(R1, { size: 14 }),
        " ",
        b.title,
        "の入力フィールドを表示中",
      ),
      f.createElement(
        "li",
        null,
        f.createElement(M1, { size: 14 }),
        " 条件付き必須項目は届出種別に応じて判定",
      ),
      f.createElement(
        "li",
        null,
        f.createElement(M1, { size: 14 }),
        " 添付資料・外字・XSDは出力前に再チェック",
      ),
    ),
  );
}
function xy() {
  return f.createElement(
    "div",
    { className: "mini-panel" },
    f.createElement("h3", null, "外字チェック"),
    f.createElement(It, {
      headers: ["原表記", "届出用表記", "扱い"],
      rows: [
        ["髙橋 健", "高橋 健", "置換承認済み"],
        ["渡邊 花子", "渡辺 花子", "説明資料候補"],
        ["○山×郎", "要確認", "IRB設置者名"],
      ],
    }),
  );
}
function Ly({ chapter: b }) {
  const R = {
    doctors: [
      ["医師マスタ", "治験 一郎", "責任医師として参照"],
      ["医師マスタ", "髙橋 健", "外字置換あり"],
    ],
    sites: [
      ["医療機関マスタ", "○○大学医学部附属病院", "施設情報を参照"],
      ["IRBマスタ", "■■法人▲▲会□□病院", "外部IRB"],
    ],
    products: [
      ["治験使用薬マスタ", "EI-A-001 10mg錠", "主たる被験薬"],
      ["コード管理", "投与経路コード 11", "経口"],
    ],
    orgs: [
      ["CRO/SMO/IRBマスタ", "○○株式会社", "CRO"],
      ["CRO/SMO/IRBマスタ", "CTN Site Support", "SMO"],
    ],
  }[b.id] ?? [
    ["届出者マスタ", "製薬協製薬株式会社", "届出者情報"],
    ["添付資料マスタ", "治験実施計画書 v3.0", "出力前に承認確認"],
  ];
  return f.createElement(
    "div",
    { className: "mini-panel" },
    f.createElement("h3", null, "マスタ参照"),
    f.createElement(It, { headers: ["参照元", "候補値", "扱い"], rows: R }),
  );
}
function Y1({ compact: b }) {
  return f.createElement(
    "div",
    { className: b ? "mini-panel" : "" },
    b && f.createElement("h3", null, "差分サマリ"),
    f.createElement(It, {
      headers: b
        ? ["種別", "項目", "判定"]
        : ["種別", "項目", "前回", "今回", "判定", "理由"],
      rows: Ny.map((D) =>
        b
          ? [D.type, D.item, D.decision]
          : [D.type, D.item, D.before, D.after, D.decision, D.reason],
      ),
    }),
  );
}
function Vy() {
  return f.createElement(
    "div",
    { className: "source-viewer" },
    f.createElement(
      "div",
      { className: "pdf-head" },
      f.createElement(Kn, { size: 16 }),
      f.createElement("strong", null, "原本・出典確認"),
    ),
    f.createElement(
      "div",
      { className: "source-page" },
      f.createElement("p", { className: "source-title" }, "000270151.pdf p.5"),
      f.createElement("p", null, "治験責任医師の氏名: 責任 一郎"),
      f.createElement(
        "p",
        { className: "source-mark" },
        "治験分担医師の氏名: 渡邊 花子",
      ),
      f.createElement("p", null, "実施医療機関: ○○大学医学部附属病院 第一内科"),
      f.createElement(
        "p",
        { className: "source-note" },
        "抽出候補の根拠ページを確認するためのビューです。最終PDFプレビューではありません。",
      ),
    ),
  );
}
function X1({ title: b, compact: D, chapter: R }) {
  const y = R?.fields?.slice(0, 5).map((H) => [H.label, H.value]) ?? [
    ["届出年月日", "20260619"],
    ["主たる被験薬の治験成分記号", "EI-A-001"],
    ["治験責任医師", "治験 一郎"],
    ["分担医師", "高橋 健（外字置換）"],
  ];
  return f.createElement(
    "div",
    { className: `pdf-preview ${D ? "compact" : ""}` },
    f.createElement(
      "div",
      { className: "pdf-head" },
      f.createElement(Kn, { size: 16 }),
      f.createElement("strong", null, b),
    ),
    f.createElement(
      "div",
      { className: "pdf-page" },
      f.createElement("p", { className: "pdf-title" }, "治験計画変更届書"),
      y.map(([H, G], j) =>
        f.createElement(
          "p",
          { key: H, className: j === 1 ? "mark" : j === 4 ? "mark warn" : "" },
          H,
          " ",
          String(G || "（未入力）").replaceAll("-", ""),
        ),
      ),
    ),
  );
}
function bt({ title: b, status: D, detail: R, tone: y }) {
  return f.createElement(
    "article",
    { className: `check-card ${y || ""}` },
    f.createElement("span", null, D),
    f.createElement("strong", null, b),
    f.createElement("p", null, R),
  );
}
function It({ headers: b, rows: D }) {
  return f.createElement(
    "div",
    { className: "table-wrap" },
    f.createElement(
      "table",
      null,
      f.createElement(
        "thead",
        null,
        f.createElement(
          "tr",
          null,
          b.map((R) => f.createElement("th", { key: R }, R)),
        ),
      ),
      f.createElement(
        "tbody",
        null,
        D.map((R, y) =>
          f.createElement(
            "tr",
            { key: y },
            R.map((H, G) => f.createElement("td", { key: G }, H)),
          ),
        ),
      ),
    ),
  );
}
hy.createRoot(document.getElementById("root")).render(
  f.createElement(Uy, null),
);
