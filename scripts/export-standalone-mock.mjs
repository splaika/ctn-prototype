import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");
const outputPath = path.join(root, "ctn-ux-react-standalone.html");

const indexHtml = await fs.readFile(indexPath, "utf8");
const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const styleMatch = indexHtml.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);

if (!scriptMatch || !styleMatch) {
  throw new Error("Could not find built JS/CSS references in dist/index.html.");
}

function assetPath(src) {
  return path.join(dist, src.replace(/^\//, ""));
}

const js = await fs.readFile(assetPath(scriptMatch[1]), "utf8");
const css = await fs.readFile(assetPath(styleMatch[1]), "utf8");

const safeJs = js.replaceAll("</script", "<\\/script");
const safeCss = css.replaceAll("</style", "<\\/style");

const standalone = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>治験届管理 - UXモック</title>
    <style>
${safeCss}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${safeJs}
    </script>
  </body>
</html>
`;

await fs.writeFile(outputPath, standalone, "utf8");
console.log(`Exported standalone mock to ${outputPath}`);
