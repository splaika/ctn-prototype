import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const standaloneFiles = [
  "ctn-operations-ui.html",
  "ctn-pdf-import-classic.html",
  "team-site.html",
  "ctn-ux-manual.html",
  "ctn-ux-mock.html",
  "ctn-ux-react-standalone.html",
  "portal.html",
  "modern-ui-proposal.html",
  "README.md",
  "staticwebapp.config.json",
  "CTN_治験届プロトタイプ共有.zip",
];

async function copyFileIfExists(file) {
  const src = path.join(root, file);
  const dest = path.join(dist, file);
  try {
    await fs.copyFile(src, dest);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function copyDir(src, dest) {
  await fs.rm(dest, { recursive: true, force: true });
  await fs.cp(src, dest, { recursive: true });
}

await fs.mkdir(dist, { recursive: true });

for (const file of standaloneFiles) {
  await copyFileIfExists(file);
}

await copyDir(path.join(root, "docs-html"), path.join(dist, "docs-html"));
await fs.mkdir(path.join(dist, "database"), { recursive: true });
await fs.copyFile(path.join(root, "database", "schema.sql"), path.join(dist, "database", "schema.sql"));

console.log("Copied standalone HTML, docs-html, README, ZIP, and database schema into dist.");
