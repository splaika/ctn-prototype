import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const artifactToolPath = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "node",
  "node_modules",
  "@oai",
  "artifact-tool",
  "dist",
  "artifact_tool.mjs"
);
const { Presentation, PresentationFile } = await import(pathToFileURL(artifactToolPath).href);

const root = path.resolve(".");
const outDir = path.join(root, "outputs");
const qaDir = path.join(root, "outputs", "ctn-workflow-summary-preview");
const pptxPath = path.join(outDir, "ctn-workflow-improvement-summary.pptx");

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function addText(slide, text, position, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: style.fontSize ?? 18,
    color: style.color ?? "slate-700",
    bold: style.bold ?? false,
  };
  return shape;
}

function addRect(slide, position, options = {}) {
  return slide.shapes.add({
    geometry: "roundRect",
    position,
    fill: options.fill ?? "white",
    line: { style: "solid", fill: options.line ?? "slate-200", width: options.lineWidth ?? 1 },
    borderRadius: options.borderRadius ?? "rounded-xl",
    shadow: options.shadow ?? "shadow-sm",
  });
}

function addPill(slide, text, left, top, width, fill, color = "white") {
  addRect(slide, { left, top, width, height: 28 }, {
    fill,
    line: fill,
    borderRadius: "rounded-full",
    shadow: "none",
  });
  addText(slide, text, { left: left + 12, top: top + 5, width: width - 24, height: 18 }, {
    fontSize: 11,
    bold: true,
    color,
  });
}

function addHeader(slide, eyebrow, title, subtitle) {
  addText(slide, eyebrow, { left: 64, top: 42, width: 360, height: 22 }, {
    fontSize: 12,
    bold: true,
    color: "teal-700",
  });
  addText(slide, title, { left: 64, top: 72, width: 820, height: 58 }, {
    fontSize: 30,
    bold: true,
    color: "slate-950",
  });
  addText(slide, subtitle, { left: 66, top: 132, width: 850, height: 42 }, {
    fontSize: 15,
    color: "slate-600",
  });
}

function addFooter(slide, page) {
  addText(slide, `CTN作成支援 MVP | ${page}/3`, { left: 64, top: 670, width: 260, height: 20 }, {
    fontSize: 11,
    color: "slate-400",
  });
}

function addProblemCard(slide, left, top, title, body, tag) {
  addRect(slide, { left, top, width: 350, height: 330 }, { fill: "white" });
  addPill(slide, tag, left + 24, top + 24, 94, "slate-100", "slate-700");
  addText(slide, title, { left: left + 24, top: top + 78, width: 290, height: 64 }, {
    fontSize: 21,
    bold: true,
    color: "slate-950",
  });
  addText(slide, body, { left: left + 24, top: top + 158, width: 298, height: 116 }, {
    fontSize: 15,
    color: "slate-600",
  });
}

function addFlowStep(slide, left, top, width, title, body, tag, fill = "white") {
  addRect(slide, { left, top, width, height: 150 }, { fill });
  addPill(slide, tag, left + 18, top + 18, 64, "teal-50", "teal-800");
  addText(slide, title, { left: left + 18, top: top + 58, width: width - 36, height: 30 }, {
    fontSize: 18,
    bold: true,
    color: "slate-950",
  });
  addText(slide, body, { left: left + 18, top: top + 92, width: width - 36, height: 42 }, {
    fontSize: 13,
    color: "slate-600",
  });
}

function addOutcome(slide, left, top, title, body, accentFill) {
  addRect(slide, { left, top, width: 536, height: 116 }, { fill: "white" });
  addRect(slide, { left: left + 22, top: top + 24, width: 12, height: 68 }, {
    fill: accentFill,
    line: accentFill,
    borderRadius: "rounded-full",
    shadow: "none",
  });
  addText(slide, title, { left: left + 52, top: top + 24, width: 420, height: 28 }, {
    fontSize: 18,
    bold: true,
    color: "slate-950",
  });
  addText(slide, body, { left: left + 52, top: top + 58, width: 430, height: 42 }, {
    fontSize: 13,
    color: "slate-600",
  });
}

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });

const presentation = Presentation.create({
  slideSize: { width: 1280, height: 720 },
});

{
  const slide = presentation.slides.add();
  slide.background.fill = "slate-50";
  addHeader(
    slide,
    "WHY CHANGE",
    "従来運用の限界: 作業は進むが、全体が見えにくい",
    "ファイル管理とDDW入力だけでは、届出準備・根拠確認・変更期限・承認履歴が分断されやすい。"
  );
  addProblemCard(
    slide,
    64,
    220,
    "情報が分散する",
    "Word/Excel/PDF/メール/Teamsに作業痕跡が散らばり、最新版・根拠資料・確認状況を探す時間が増える。",
    "File"
  );
  addProblemCard(
    slide,
    465,
    220,
    "変更と期限が属人化する",
    "分担医師変更などの6か月/12か月期限、変更届の版管理、外字確認が担当者の記憶に依存しやすい。",
    "Risk"
  );
  addProblemCard(
    slide,
    866,
    220,
    "DDW前提のワークフローの限界",
    "DDWには入力結果は残るが、社内の根拠確認・レビュー・承認・変更判断の過程は別管理になりやすい。",
    "Scope"
  );
  addFooter(slide, 1);
}

{
  const slide = presentation.slides.add();
  slide.background.fill = "slate-50";
  addHeader(
    slide,
    "TARGET WORKFLOW",
    "CTN作成支援: 届出データを中心に業務を統合する",
    "SharePointは文書・根拠保管、Dataverseは構造化データ、ダッシュボードは進捗・期限・承認を担う。"
  );
  const stepW = 200;
  const top = 250;
  const starts = [64, 304, 544, 784, 1024];
  addFlowStep(slide, starts[0], top, stepW, "マスタ変更", "医師・医療機関・薬剤などの変更を一元登録", "1");
  addFlowStep(slide, starts[1], top, stepW, "届出候補化", "変更種別から届出要否と提出期限を自動判定", "2");
  addFlowStep(slide, starts[2], top, stepW, "入力・根拠リンク", "届出項目とSharePoint資料を紐づけて確認", "3");
  addFlowStep(slide, starts[3], top, stepW, "レビュー・承認", "起票、レビュー、承認をダッシュボードで集中管理", "4");
  addFlowStep(slide, starts[4], top, stepW, "出力", "承認後のみPDFイメージ確認とXML出力を有効化", "5");
  for (let i = 0; i < 4; i++) {
    addText(slide, "→", { left: starts[i] + stepW + 12, top: top + 55, width: 32, height: 36 }, {
      fontSize: 28,
      bold: true,
      color: "teal-700",
    });
  }
  addRect(slide, { left: 170, top: 485, width: 940, height: 82 }, { fill: "teal-50", line: "teal-100" });
  addText(slide, "設計上のポイント", { left: 200, top: 506, width: 180, height: 24 }, {
    fontSize: 16,
    bold: true,
    color: "teal-900",
  });
  addText(slide, "入力画面にワークフローを埋め込まず、ダッシュボードで複数届・複数変更を横断管理する。DDWは最終登録先として位置づけ、社内の準備品質を高める。", { left: 380, top: 506, width: 690, height: 44 }, {
    fontSize: 14,
    color: "teal-900",
  });
  addFooter(slide, 2);
}

{
  const slide = presentation.slides.add();
  slide.background.fill = "slate-50";
  addHeader(
    slide,
    "MVP VALUE",
    "MVPで示すべき改善効果",
    "初回届20製品、各10回以上の変更届が並行しても、進捗・期限・差分・承認を同じ画面で追える状態を作る。"
  );
  addOutcome(slide, 64, 220, "全体像が把握できる", "製品別・届出別・版別に進捗、変更状況、期限、レビュー状態を横断して確認できる。", "blue-500");
  addOutcome(slide, 680, 220, "期限漏れを防ぐ", "変更日を起点に6か月/12か月期限を算出し、担当者・承認者へリマインドする。", "amber-400");
  addOutcome(slide, 64, 376, "レビューと承認を統制する", "起票、レビュー、承認、出力を分け、承認前のPDF/XML出力を抑止する。", "emerald-500");
  addOutcome(slide, 680, 376, "入力品質を上げる", "外字、表記ゆれ、順序番号、複数医師・施設・薬剤の入力チェックを構造化する。", "rose-500");
  addRect(slide, { left: 190, top: 560, width: 900, height: 64 }, { fill: "slate-900", line: "slate-900" });
  addText(slide, "結論: DDWを置き換えるのではなく、DDW入力前後の社内プロセスを構造化し、提出品質と期限管理を安定させる。", { left: 230, top: 580, width: 820, height: 28 }, {
    fontSize: 16,
    bold: true,
    color: "white",
  });
  addFooter(slide, 3);
}

for (const [index, slide] of presentation.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  await writeBlob(path.join(qaDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(qaDir, `${stem}.layout.json`), await layout.text());
}

await writeBlob(
  path.join(qaDir, "deck-montage.webp"),
  await presentation.export({ format: "webp", montage: true, scale: 1 })
);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(pptxPath);

await fs.writeFile(
  path.join(qaDir, "visual-qa.md"),
  [
    "# Visual QA",
    "",
    "- 3 slides rendered to PNG.",
    "- Deck montage exported for review.",
    "- All content is editable PowerPoint text/shapes.",
    "- No server or browser runtime is required to open the PPTX.",
  ].join("\n"),
  "utf8"
);

console.log(JSON.stringify({
  pptxPath,
  montagePath: path.join(qaDir, "deck-montage.webp"),
}, null, 2));
