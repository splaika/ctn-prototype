// Inline the Vite build into one self-contained HTML → served live by GitHub Pages.
// This app lives at ctn-prototype/demo/app; the live entry is ctn-prototype/demo/index.html
// (one level up), so GitHub Pages serves it at /ctn-prototype/demo/.
// Google Fonts links are kept (load online, fall back to system fonts offline).
// Run via `npm run build:demo`.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname; // = demo/app/
const dist = `${root}dist`;
const outFile = new URL("../../index.html", import.meta.url).pathname; // = demo/index.html
let html = readFileSync(`${dist}/index.html`, "utf8");

const assets = readdirSync(`${dist}/assets`);
const cssFile = assets.find((f) => f.endsWith(".css"));
const jsFile = assets.find((f) => f.endsWith(".js"));
const css = readFileSync(`${dist}/assets/${cssFile}`, "utf8");
const js = readFileSync(`${dist}/assets/${jsFile}`, "utf8");

// Replace with FUNCTION replacers: a string replacement would interpret `$&`,
// `$1` etc., and the minified bundles contain such sequences (e.g. React's
// `"$&/"`), which would silently corrupt the output.
html = html.replace(
  /<link rel="stylesheet"[^>]*href="\.\/assets\/[^"]+\.css"\s*\/?>/,
  () => `<style>\n${css}\n</style>`
);
html = html.replace(
  /<script type="module"[^>]*src="\.\/assets\/[^"]+\.js"><\/script>/,
  () => `<script type="module">\n${js}\n</script>`
);

writeFileSync(outFile, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`demo/index.html written (${kb} KB, self-contained) → ${outFile}`);
