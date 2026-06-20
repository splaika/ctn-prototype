import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const input = process.argv[2] || path.join(root, "dist", "index.html");
const output =
  process.argv[3] ||
  path.join(root, "outputs", "email-direct", "CTN_UX_Mock_DIRECT.html");

function resolveAssetPath(assetRef) {
  if (/^https?:\/\//i.test(assetRef) || /^data:/i.test(assetRef)) {
    throw new Error(`External asset is not allowed in direct-share HTML: ${assetRef}`);
  }
  return path.resolve(path.dirname(input), assetRef.replace(/^\//, ""));
}

function escapeClosingTag(content, tagName) {
  return content.replaceAll(`</${tagName}`, `<\\/${tagName}`);
}

let html = await fs.readFile(input, "utf8");

const stylesheetPattern = /<link\b(?=[^>]*rel=["']stylesheet["'])(?=[^>]*href=["']([^"']+)["'])[^>]*>/gi;
const stylesheetRefs = [...html.matchAll(stylesheetPattern)];
for (const match of stylesheetRefs) {
  const href = match[1];
  const css = await fs.readFile(resolveAssetPath(href), "utf8");
  html = html.replace(match[0], `<style>\n${escapeClosingTag(css, "style")}\n</style>`);
}

const modulePreloadPattern = /<link\b(?=[^>]*rel=["']modulepreload["'])[^>]*>/gi;
html = html.replace(modulePreloadPattern, "");

const scriptPattern = /<script\b(?=[^>]*src=["']([^"']+)["'])[^>]*>\s*<\/script>/gi;
const scriptRefs = [...html.matchAll(scriptPattern)];
for (const match of scriptRefs) {
  const src = match[1];
  const js = await fs.readFile(resolveAssetPath(src), "utf8");
  const typeMatch = match[0].match(/\btype=["']([^"']+)["']/i);
  const type = typeMatch?.[1] || "module";
  html = html.replace(
    match[0],
    `<script type="${type}">\n${escapeClosingTag(js, "script")}\n</script>`,
  );
}

const htmlWithoutInlineBlocks = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

if (/<script\b[^>]*\bsrc=/i.test(htmlWithoutInlineBlocks)) {
  throw new Error("Generated HTML still contains an external script src reference.");
}

if (/<link\b(?=[^>]*rel=["']stylesheet["'])(?=[^>]*href=)[^>]*>/i.test(htmlWithoutInlineBlocks)) {
  throw new Error("Generated HTML still contains an external stylesheet link reference.");
}

if (!html.includes('<div id="root"></div>')) {
  throw new Error('Generated HTML is missing <div id="root"></div>.');
}

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, html, "utf8");

console.log(`Exported direct-share mock: ${output}`);
