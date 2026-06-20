import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Lock,
  Plus,
  Save,
  Search,
  Upload,
} from "lucide-react";
import { menuSections, workflowSteps } from "./schema.js";
import "./styles.css";

const statusLabels = {
  draft: "入力中",
  review: "レビュー中",
  approved: "承認済",
  output: "出力済",
  overdue: "期限注意",
};

const trialPortfolio = Array.from({ length: 20 }, (_, index) => {
  const no = String(index + 1).padStart(2, "0");
  const changes = 10 + (index % 5);
  const states = ["review", "draft", "approved", "overdue", "output"];
  return {
    id: `CTN-${no}`,
    product: `CTN-${no} 試験薬 ${String.fromCharCode(65 + (index % 8))}`,
    trialCode: `JPN-CTN-2026-${no}`,
    initialReceipt: `2026-${1000 + index}`,
    changes,
    activeDrafts: 1 + (index % 3),
    owner: ["佐藤", "田中", "鈴木", "高橋"][index % 4],
    reviewer: ["薬事レビューA", "薬事レビューB", "医学レビュー", "QA"][index % 4],
    due: `2026-${String(6 + (index % 6)).padStart(2, "0")}-${String(8 + (index % 18)).padStart(2, "0")}`,
    status: states[index % states.length],
  };
});

const reminderRows = [
  { target: "分担医師 追加", product: "CTN-03 試験薬 C", changed: "2025-12-12", due: "2026-06-12", owner: "田中", approver: "医学レビュー", rule: "6か月以内", level: "urgent" },
  { target: "責任医師 氏名変更", product: "CTN-08 試験薬 H", changed: "2025-08-26", due: "2026-08-26", owner: "高橋", approver: "QA", rule: "12か月以内", level: "watch" },
  { target: "医療機関 追加", product: "CTN-12 試験薬 D", changed: "2026-01-05", due: "2026-07-05", owner: "佐藤", approver: "薬事レビューA", rule: "6か月以内", level: "watch" },
  { target: "治験使用薬 数量変更", product: "CTN-17 試験薬 A", changed: "2025-10-30", due: "2026-10-30", owner: "鈴木", approver: "薬事レビューB", rule: "12か月以内", level: "normal" },
];

const importJobs = [
  { file: "000236407.pdf", status: "確認待ち", version: "v1.0 imported", confidence: "72%", mapping: "48/63", next: "抽出候補を確認" },
  { file: "000270151.pdf", status: "取込済み", version: "v1.1 confirmed", confidence: "86%", mapping: "59/63", next: "変更届を作成可能" },
  { file: "初回届_試験薬C.pdf", status: "OCR中", version: "v1.0 imported", confidence: "処理中", mapping: "12/63", next: "処理完了待ち" },
];

const tableSamples = {
  productTable: [
    ["001", "主たる被験薬", "10mg錠", "変更なし", "順序番号固定"],
    ["002", "対照薬", "プラセボ錠", "追加", "次回届出対象"],
  ],
  combinationTable: [
    ["001", "併用薬", "救済薬", "使用条件あり", "備考確認"],
    ["002", "医療機器相当", "検査機器", "該当あり", "添付資料あり"],
  ],
  institutionTable: [
    ["001", "東京中央病院", "責任医師: 山田 太郎", "IRB登録済", "分担医師 12名"],
    ["002", "大阪北医療センター", "責任医師: 渡邊 花子", "外字確認中", "分担医師 8名"],
  ],
  doctorTable: [
    ["001", "責任医師", "山田 太郎", "変更なし", "JIS表記確認済"],
    ["014", "分担医師", "渡邊 花子", "氏名変更", "原表記/届出用表記を保持"],
    ["015", "分担医師", "髙橋 健", "追加", "6か月期限管理"],
  ],
  gaijiTable: [
    ["渡邊", "渡辺", "医師氏名", "本人確認待ち", "説明資料に出力"],
    ["髙橋", "高橋", "分担医師", "承認済", "置換履歴保持"],
  ],
};

function App() {
  const [activeId, setActiveId] = useState("dashboard");
  const active = useMemo(() => menuSections.find((section) => section.id === activeId) ?? menuSections[0], [activeId]);
  const progress = 100;

  return (
    <div className="ctn-shell">
      <aside className="side-nav">
        <div className="brand">
          <span>CTN</span>
          <div>
            <strong>治験届管理</strong>
            <small>入力・版管理・承認</small>
          </div>
        </div>
        <div className="progress-box">
          <div>
            <span>入力完了度</span>
            <strong>{progress}%</strong>
          </div>
          <meter min="0" max="100" value={progress} />
          <small>出力はダッシュボードで承認後に実行</small>
        </div>
        <nav>
          {menuSections.map((section) => {
            const Icon = section.icon;
            return (
              <button key={section.id} className={section.id === activeId ? "active" : ""} onClick={() => setActiveId(section.id)}>
                <Icon size={16} />
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <small>{active.list}</small>
            <h1>{active.title}</h1>
            <p>{active.description}</p>
          </div>
          <div className="toolbar">
            <label className="search">
              <Search size={16} />
              <input placeholder="画面内を検索" />
            </label>
            <button className="icon-button" title="保存">
              <Save size={16} />
              保存
            </button>
          </div>
        </header>

        {renderContent(active)}
      </main>
    </div>
  );
}

function renderContent(active) {
  if (active.mode === "dashboard") return <Dashboard />;
  if (active.mode === "import") return <ImportPage />;
  if (active.mode === "history") return <HistoryPage />;
  if (active.mode === "protocolStakeholders") return <StakeholdersPage />;
  if (active.mode === "siteGovernance") return <SiteGovernancePage />;
  if (active.mode === "documentsTable") return <DocumentsPage />;
  if (active.mode === "referencesTable") return <SimpleTable title="参照届出" headers={["順序", "届出区分", "受付番号", "届出日", "参照理由"]} rows={[["001", "初回届", "2026-1001", "2026-04-01", "変更届作成元"], ["002", "変更届", "2026-1120", "2026-05-18", "差分比較対象"]]} />;
  if (active.mode?.includes("Table")) return <GenericTable active={active} />;
  return <FieldForm active={active} />;
}

function Dashboard() {
  const counts = trialPortfolio.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }), {});
  return (
    <section className="dashboard-grid">
      <div className="metric-strip">
        <Metric label="管理中の初回届" value="20" />
        <Metric label="変更届累計" value={trialPortfolio.reduce((sum, row) => sum + row.changes, 0)} />
        <Metric label="進行中ドラフト" value={trialPortfolio.reduce((sum, row) => sum + row.activeDrafts, 0)} />
        <Metric label="期限注意" value={counts.overdue || 0} tone="danger" />
      </div>

      <section className="panel">
        <div className="section-title">
          <div>
            <h2>届出ポートフォリオ</h2>
            <p>20製品分の初回届と、各製品10回以上の変更届を横断管理します。</p>
          </div>
          <button><Plus size={16} />変更届を起票</button>
        </div>
        <DataTable
          headers={["製品", "治験識別記号", "初回受付", "変更届", "担当", "承認者", "次期限", "状態"]}
          rows={trialPortfolio.map((row) => [
            row.product,
            row.trialCode,
            row.initialReceipt,
            `${row.changes}回 / Draft ${row.activeDrafts}`,
            row.owner,
            row.reviewer,
            row.due,
            <span className={`status ${row.status}`}>{statusLabels[row.status]}</span>,
          ])}
        />
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <h2>期限リマインダー</h2>
            <p>分担医師などの変更日から6か月/12か月を超えないよう通知します。</p>
          </div>
          <button><Bell size={16} />通知設定</button>
        </div>
        <DataTable
          headers={["変更内容", "対象届", "変更日", "届出期限", "担当者", "承認者", "ルール"]}
          rows={reminderRows.map((row) => [
            <span className={`deadline ${row.level}`}>{row.target}</span>,
            row.product,
            row.changed,
            row.due,
            row.owner,
            row.approver,
            row.rule,
          ])}
        />
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <h2>ワークフロー</h2>
            <p>入力ページではなく、ダッシュボードで起票・レビュー・承認・出力を集中管理します。</p>
          </div>
          <button><FileCheck2 size={16} />PDF確認</button>
        </div>
        <div className="workflow">
          {workflowSteps.map((step) => (
            <article key={step.id} className={`workflow-card ${step.status}`}>
              <span>{step.status === "locked" ? <Lock size={15} /> : <CheckCircle2 size={15} />}</span>
              <strong>{step.title}</strong>
              <small>{step.owner}</small>
              <p>{step.note}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ImportPage() {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="tag">Import Pipeline</span>
          <h2>既存PDFからDB化</h2>
          <p>PDF原本保存、OCR/テキスト抽出、XSD項目マッピング、人手確認、確定版DB化、変更届バージョン作成の流れで管理します。</p>
        </div>
        <button><Upload size={16} />PDFを取り込む</button>
      </div>
      <div className="pipeline">
        {["PDF原本保存", "テキスト/OCR抽出", "XSD項目へマッピング", "人手確認", "確定版DB化", "変更届バージョン作成"].map((label, index) => (
          <div key={label}><span>{index + 1}</span><strong>{label}</strong></div>
        ))}
      </div>
      <DataTable
        headers={["PDFファイル", "状態", "取込版", "抽出信頼度", "マッピング", "次アクション"]}
        rows={importJobs.map((job) => [job.file, job.status, job.version, job.confidence, job.mapping, job.next])}
      />
    </section>
  );
}

function FieldForm({ active }) {
  return (
    <section className="panel">
      <div className="field-grid">
        {active.fields?.map((field) => (
          <label key={field.key} className={field.type === "textarea" ? "field wide" : "field"}>
            <span>
              {field.label}
              {field.required && <em>必須</em>}
            </span>
            {field.type === "textarea" ? (
              <textarea defaultValue={sampleValue(field)} maxLength={field.limit} />
            ) : field.type === "select" ? (
              <select defaultValue={field.options?.[0]}>
                {field.options?.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input type={field.type || "text"} defaultValue={sampleValue(field)} />
            )}
            <small>{field.xsd ? `XSD: ${field.xsd}` : "SharePoint/Dataverse入力フィールド"}</small>
          </label>
        ))}
      </div>
    </section>
  );
}

function GenericTable({ active }) {
  const rows = tableSamples[active.mode] ?? [["001", active.title, "サンプル値", "変更なし", "確認済"]];
  return <SimpleTable title={active.title} headers={["順序番号", "区分", "名称/内容", "変更状態", "確認メモ"]} rows={rows} />;
}

function StakeholdersPage() {
  return (
    <SimpleTable
      title="費用負担者・治験調整医師・CRO"
      headers={["順序番号", "種別", "名称/氏名", "所属/所在地", "変更状態"]}
      rows={[
        ["001", "費用負担者", "株式会社CTNファーマ", "東京都千代田区", "変更なし"],
        ["001", "治験調整医師", "山田 太郎", "東京中央病院 循環器内科", "追加"],
        ["001", "CRO", "CTN Clinical Research", "モニタリング・DM", "契約中"],
      ]}
    />
  );
}

function SiteGovernancePage() {
  return (
    <SimpleTable
      title="施設別SMO・IRB"
      headers={["施設順序", "施設名", "種別", "名称", "確認状態"]}
      rows={[
        ["001", "東京中央病院", "IRB", "東京中央病院治験審査委員会", "登録済"],
        ["001", "東京中央病院", "SMO", "CTN Site Support", "委託中"],
        ["002", "大阪北医療センター", "IRB", "大阪北IRB", "確認中"],
      ]}
    />
  );
}

function DocumentsPage() {
  return (
    <SimpleTable
      title="添付資料・備考"
      headers={["順序", "資料種別", "ファイル名", "SharePoint保管先", "状態"]}
      rows={[
        ["001", "治験実施計画書", "protocol_v3.pdf", "Attachments/CTN-03", "承認済"],
        ["002", "外字説明資料", "gaiji_explanation.docx", "Gaiji Explanations", "作成待ち"],
      ]}
    />
  );
}

function HistoryPage() {
  return (
    <SimpleTable
      title="履歴・監査"
      headers={["日時", "操作", "対象", "実施者", "監査メモ"]}
      rows={[
        ["2026-06-01 09:10", "変更届起票", "CTN-03 v1.2 draft", "田中", "初回届確定版から作成"],
        ["2026-06-01 11:22", "外字置換確認", "渡邊→渡辺", "医学レビュー", "説明資料出力対象"],
        ["2026-06-01 15:40", "レビュー差戻し", "分担医師追加", "QA", "6か月期限を再確認"],
      ]}
    />
  );
}

function SimpleTable({ title, headers, rows }) {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="tag">複数入力</span>
          <h2>{title}</h2>
          <p>追加、変更、削除、氏名変更を行として残し、順序番号と監査証跡を確認できる設計です。</p>
        </div>
        <button><Plus size={16} />行を追加</button>
      </div>
      <DataTable headers={headers} rows={rows} />
    </section>
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

function Metric({ label, value, tone }) {
  return (
    <article className={`metric ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function sampleValue(field) {
  if (field.type === "date") return "2026-06-01";
  if (field.type === "number") return "1";
  if (field.type === "textarea") return `${field.label}の入力例。変更理由、根拠、外字の有無を確認します。`;
  if (field.key?.toLowerCase().includes("name")) return "株式会社CTNファーマ";
  if (field.key?.toLowerCase().includes("address")) return "東京都千代田区1-1-1";
  return "";
}

createRoot(document.getElementById("root")).render(<App />);
