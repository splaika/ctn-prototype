import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");
const outDir = path.join(root, "docs-html");

const docOrder = [
  "architecture-overview.md",
  "sharepoint-design.md",
  "dataverse-design.md",
  "workflow-reminder-design.md",
  "pdf-import-design.md",
  "gaiji-handling-design.md",
  "react-microsoft-implementation.md",
  "user-guide.md",
  "admin-guide.md",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return text;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
    rows.push(lines[i]);
    i += 1;
  }

  if (rows.length < 2 || !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(rows[1])) {
    return null;
  }

  const cells = rows.map((row) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );

  const head = cells[0];
  const body = cells.slice(2);
  const html = [
    "<div class=\"table-wrap\"><table>",
    "<thead><tr>",
    ...head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`),
    "</tr></thead>",
    "<tbody>",
    ...body.flatMap((row) => [
      "<tr>",
      ...row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`),
      "</tr>",
    ]),
    "</tbody></table></div>",
  ].join("");

  return { html, next: i };
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const toc = [];
  let paragraph = [];
  let list = [];
  let inCode = false;
  let code = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    const table = parseTable(lines, i);
    if (table) {
      flushParagraph();
      flushList();
      html.push(table.html);
      i = table.next - 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      toc.push({ level, text, id });
      html.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return { body: html.join("\n"), toc };
}

function pageTemplate({ title, body, toc, nav, sourceName }) {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | CTN設計書</title>
    <link rel="stylesheet" href="assets/docs.css" />
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="index.html"><span>CTN</span><strong>設計書ビューア</strong></a>
        <nav>${nav}</nav>
      </aside>
      <main class="document">
        <div class="doc-meta">
          <a href="index.html">設計書一覧</a>
          <span>${escapeHtml(sourceName)}</span>
        </div>
        <header class="doc-header">
          <h1>${escapeHtml(title)}</h1>
          <p>Markdown設計書をブラウザで読みやすい形式に変換したHTMLです。</p>
        </header>
        ${toc.length > 1 ? `<details class="toc" open><summary>このページの目次</summary>${toc.map((item) => `<a class="level-${item.level}" href="#${item.id}">${escapeHtml(item.text)}</a>`).join("")}</details>` : ""}
        <article class="content">${body}</article>
      </main>
    </div>
  </body>
</html>`;
}

function indexTemplate({ cards, nav }) {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CTN設計書ビューア</title>
    <link rel="stylesheet" href="assets/docs.css" />
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="index.html"><span>CTN</span><strong>設計書ビューア</strong></a>
        <nav>${nav}</nav>
      </aside>
      <main class="document">
        <header class="doc-header hero">
          <p class="eyebrow">CTN Documentation</p>
          <h1>治験届作成支援システム 設計書</h1>
          <p>SharePoint、Dataverse、PDF取込、外字、ワークフロー、ユーザー運用の設計書をHTMLで閲覧できます。</p>
        </header>
        <section class="card-grid">${cards}</section>
      </main>
    </div>
  </body>
</html>`;
}

const css = `
:root {
  color-scheme: light;
  font-family: "Segoe UI", "Yu Gothic UI", Meiryo, sans-serif;
  --bg: #f5f7f8;
  --surface: #ffffff;
  --line: #dfe6e8;
  --text: #1d2b31;
  --muted: #66777e;
  --brand: #0f4c5c;
  --accent: #f2c94c;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); }
a { color: inherit; }
.shell { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 100vh; }
.sidebar { position: sticky; top: 0; height: 100vh; overflow: auto; padding: 18px; background: #103b46; color: #eef8f8; }
.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; text-decoration: none; }
.brand span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px; background: var(--accent); color: #12343b; font-weight: 800; }
.brand strong { font-size: 16px; }
.sidebar nav { display: grid; gap: 5px; }
.sidebar nav a { padding: 9px 10px; border-radius: 7px; text-decoration: none; color: #e8f4f5; font-size: 14px; }
.sidebar nav a:hover, .sidebar nav a.active { background: rgba(255,255,255,.14); }
.document { width: min(1120px, calc(100vw - 320px)); margin: 0 auto; padding: 28px; }
.doc-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; color: var(--muted); font-size: 13px; }
.doc-meta a { color: var(--brand); font-weight: 700; }
.doc-header { padding: 22px; margin-bottom: 18px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.doc-header.hero { padding: 28px; }
.eyebrow { margin: 0 0 6px; color: var(--brand); font-weight: 800; }
h1, h2, h3, h4, p { margin-top: 0; }
h1 { margin-bottom: 8px; font-size: 30px; letter-spacing: 0; }
h2 { margin: 32px 0 10px; padding-bottom: 7px; border-bottom: 1px solid var(--line); font-size: 22px; letter-spacing: 0; }
h3 { margin: 24px 0 8px; font-size: 18px; letter-spacing: 0; }
h4 { margin: 18px 0 6px; font-size: 15px; letter-spacing: 0; }
p, li, td, th { line-height: 1.72; }
.content, .toc, .card { border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.content { padding: 24px; }
.toc { display: grid; gap: 8px; padding: 14px 16px; margin-bottom: 18px; }
.toc summary { cursor: pointer; font-weight: 800; }
.toc a { display: block; padding: 3px 0; color: var(--brand); text-decoration: none; }
.toc .level-3 { padding-left: 16px; font-size: 14px; }
.toc .level-4 { padding-left: 30px; font-size: 13px; color: var(--muted); }
code { padding: 2px 5px; border-radius: 5px; background: #edf3f4; color: #0d3b40; }
pre { overflow: auto; padding: 14px; border-radius: 8px; background: #102a31; color: #eaf6f7; }
pre code { padding: 0; background: transparent; color: inherit; }
.table-wrap { overflow: auto; margin: 14px 0 22px; border: 1px solid var(--line); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; min-width: 720px; }
th, td { padding: 10px 12px; border-bottom: 1px solid #e8eef0; text-align: left; vertical-align: top; }
th { background: #f6f9fa; color: #4e6269; font-size: 13px; }
tr:last-child td { border-bottom: 0; }
ul { padding-left: 1.3rem; }
.card-grid { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 14px; }
.card { display: grid; gap: 8px; padding: 18px; text-decoration: none; }
.card:hover { border-color: #9cc2c7; box-shadow: 0 10px 24px rgba(19, 61, 70, .08); }
.card strong { color: var(--brand); font-size: 17px; }
.card span { color: var(--muted); font-size: 13px; }
@media (max-width: 920px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; }
  .document { width: 100%; padding: 18px; }
  .card-grid { grid-template-columns: 1fr; }
}
`;

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(path.join(outDir, "assets"), { recursive: true });
await fs.writeFile(path.join(outDir, "assets", "docs.css"), css.trim(), "utf8");

const files = (await fs.readdir(docsDir))
  .filter((file) => file.endsWith(".md"))
  .sort((a, b) => {
    const ai = docOrder.indexOf(a);
    const bi = docOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b, "ja");
  });

const pages = [];
for (const file of files) {
  const source = await fs.readFile(path.join(docsDir, file), "utf8");
  const { body, toc } = markdownToHtml(source);
  const title = toc[0]?.text ?? file.replace(/\.md$/, "");
  const htmlFile = file.replace(/\.md$/, ".html");
  pages.push({ file, htmlFile, title, summary: toc.slice(1, 4).map((item) => item.text).join(" / ") });
  const nav = pagesPlaceholder(files, file);
  await fs.writeFile(path.join(outDir, htmlFile), pageTemplate({ title, body, toc, nav, sourceName: file }), "utf8");
}

function pagesPlaceholder(allFiles, activeFile) {
  return allFiles.map((file) => {
    const page = pages.find((item) => item.file === file);
    const label = page?.title ?? file.replace(/\.md$/, "");
    const href = file.replace(/\.md$/, ".html");
    const active = file === activeFile ? " class=\"active\"" : "";
    return `<a${active} href="${href}">${escapeHtml(label)}</a>`;
  }).join("");
}

const finalNav = pages.map((page) => `<a href="${page.htmlFile}">${escapeHtml(page.title)}</a>`).join("");
for (const page of pages) {
  const html = await fs.readFile(path.join(outDir, page.htmlFile), "utf8");
  const nav = pages.map((item) => {
    const active = item.file === page.file ? " class=\"active\"" : "";
    return `<a${active} href="${item.htmlFile}">${escapeHtml(item.title)}</a>`;
  }).join("");
  await fs.writeFile(path.join(outDir, page.htmlFile), html.replace(/<nav>[\s\S]*?<\/nav>/, `<nav>${nav}</nav>`), "utf8");
}

const cards = pages.map((page) => `
  <a class="card" href="${page.htmlFile}">
    <strong>${escapeHtml(page.title)}</strong>
    <span>${escapeHtml(page.file)}</span>
    <p>${escapeHtml(page.summary || "設計書をHTMLで表示します。")}</p>
  </a>
`).join("");

await fs.writeFile(path.join(outDir, "index.html"), indexTemplate({ cards, nav: finalNav }), "utf8");

console.log(`Exported ${pages.length} HTML documents to ${outDir}`);
