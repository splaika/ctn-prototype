// ============================================================================
// gen-browser-seed.mjs — デモデータ投入スクリプト（ブラウザ用）を生成
// ----------------------------------------------------------------------------
// 単一ソース:
//   provision/ctn-lists.schema.json          … プロパティ → 列 の対応
//   demo/app/src/ctn/data/seed.ts (src/shared) … デモデータ本体
// 生成物:
//   provision/browser-seed.js                … コンソールに貼って実行する
//
// 列の対応はスキーマの `prop` から自動で導くので、列を増やしてもこの
// スクリプトを直す必要はない（74列を手で書き写さない）。
//
//   node scripts/gen-browser-seed.mjs
// ============================================================================
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROVISION = join(ROOT, "provision");

// --- デモデータを seed.ts から取り出す（TS のままでは実行できないので束ねる）---
const work = mkdtempSync(join(tmpdir(), "ctn-seed-"));
const bundle = join(work, "seed-bundle.mjs");
const esbuild = join(ROOT, "node_modules", "esbuild", "bin", "esbuild");
execFileSync(
  process.execPath,
  [esbuild, join(ROOT, "scripts", "seed-entry.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${bundle}`, "--log-level=error"],
  { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] }
);
const extracted = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: "utf8" }));
const db = extracted.db;
const notifTypeShort = extracted.notifTypeShort;

const schema = JSON.parse(await readFile(join(PROVISION, "ctn-lists.schema.json"), "utf8"));

// --- リストと db のコレクションの対応（投入順＝参照の依存順）-----------------
const ORDER = [
  { list: "CtnSponsors", key: "sponsors" },
  { list: "CtnInstitutions", key: "institutions" },
  { list: "CtnIrbs", key: "irbs" },
  { list: "CtnDoctors", key: "doctors" },
  { list: "CtnSiteStaff", key: "siteStaff" },
  { list: "CtnCodes", key: "codes" },
  { list: "CtnCompounds", key: "compounds" },
  { list: "CtnNotifications", key: "notifications" },
  { list: "CtnGaiji", key: "gaiji" },
  { list: "CtnAudit", key: "audit" },
];

// スキーマから「列の作り方」だけを抜き出す（プロパティ名・型・参照先）
const listSpecs = {};
for (const l of schema.lists) {
  listSpecs[l.name] = {
    // Title 列のもとになるプロパティ（"(表示名)" のリストは個別処理）
    titleProp: l.fields.find((f) => f.name === "Title")?.prop ?? "",
    fields: l.fields
      .filter((f) => !f.builtIn)
      .map((f) => ({ prop: f.prop, name: f.name, type: f.type, lookupList: f.lookupList })),
  };
}

const script = `// ===========================================================================
// CTN Suite — デモデータ投入スクリプト（ブラウザのコンソール用・自動生成）
// ---------------------------------------------------------------------------
// このファイルは scripts/gen-browser-seed.mjs が
// provision/ctn-lists.schema.json と seed.ts から生成します。直接編集しないこと。
//
// 前提: browser-setup.js でリストが作成済みであること。
//
// 使い方:
//   1. 対象の SharePoint サイトをブラウザで開く
//   2. F12 → Sources → Snippets → New snippet に貼り付けて Ctrl+Enter
//      （Console に直接貼れない場合。Console なら "allow pasting" を手入力後に貼付）
//
// SharePoint は項目IDを自分で採番するため、seed の文字列ID（inst-1 等）を
// 採番された数値IDへ張り替えながら投入します。
//
// 冪等ではありません。既にデータがある状態で実行すると重複します。
// 実行前に「投入済みか」を確認し、必要なら各リストの項目を削除してください。
// ===========================================================================
(async () => {
  const DB = ${JSON.stringify(db)};
  const NOTIF_TYPE_SHORT = ${JSON.stringify(notifTypeShort)};
  const SPECS = ${JSON.stringify(listSpecs, null, 2)};
  const ORDER = ${JSON.stringify(ORDER)};
  const PAYLOAD_VERSION = "1";

  const ctx = window._spPageContextInfo;
  const web = (ctx && ctx.webAbsoluteUrl) || location.origin + location.pathname.split("/_layouts")[0];
  console.log("%cCTN Suite デモデータ投入", "font-weight:bold;font-size:14px");
  console.log("対象サイト:", web);

  const digestRes = await fetch(web + "/_api/contextinfo", {
    method: "POST",
    headers: { Accept: "application/json;odata=nometadata" },
    credentials: "same-origin",
  });
  if (!digestRes.ok) {
    console.error("フォームダイジェストを取得できませんでした。HTTP", digestRes.status);
    return;
  }
  const digest = (await digestRes.json()).FormDigestValue;

  function listApi(title) {
    return web + "/_api/web/lists/getbytitle('" + encodeURIComponent(title) + "')";
  }
  async function addItem(listTitle, fields) {
    const r = await fetch(listApi(listTitle) + "/items", {
      method: "POST",
      headers: {
        Accept: "application/json;odata=minimalmetadata",
        "Content-Type": "application/json;odata=nometadata",
        "X-RequestDigest": digest,
      },
      credentials: "same-origin",
      body: JSON.stringify(fields),
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 400));
    return r.json();
  }
  async function mergeItem(listTitle, id, fields, etag) {
    const r = await fetch(listApi(listTitle) + "/items(" + id + ")", {
      method: "POST",
      headers: {
        Accept: "application/json;odata=minimalmetadata",
        "Content-Type": "application/json;odata=nometadata",
        "X-RequestDigest": digest,
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": etag,
      },
      credentials: "same-origin",
      body: JSON.stringify(fields),
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 400));
  }
  async function countItems(listTitle) {
    const r = await fetch(listApi(listTitle) + "/ItemCount", {
      headers: { Accept: "application/json;odata=nometadata" },
      credentials: "same-origin",
    });
    if (!r.ok) return -1;
    return (await r.json()).value;
  }

  // --- 二重投入の防止 -----------------------------------------------------
  const existing = [];
  for (const o of ORDER) {
    const n = await countItems(o.list);
    if (n > 0) existing.push(o.list + "(" + n + "件)");
  }
  if (existing.length) {
    console.warn(
      "%c既にデータが入っています: " + existing.join(", "),
      "color:#b45309;font-weight:bold"
    );
    console.warn(
      "このスクリプトは冪等ではありません。続けると重複します。\\n" +
        "投入し直す場合は各リストの項目を削除してから再実行してください。"
    );
    return;
  }

  // 旧ID(文字列) → 新ID(数値) の対応表。リスト名で引く
  const idMap = {};
  for (const o of ORDER) idMap[o.list] = {};

  /** スキーマの prop に従って1件分の列値を組み立てる */
  function buildFields(listName, rec) {
    const spec = SPECS[listName];
    const out = {};
    if (spec.titleProp && spec.titleProp.indexOf("(") !== 0) {
      out.Title = String(rec[spec.titleProp] ?? "").slice(0, 255);
    }
    for (const f of spec.fields) {
      if (f.prop.indexOf("(") === 0) continue; // "(集約全体)" 等は個別処理
      const v = rec[f.prop];
      if (f.type === "Lookup") {
        const mapped = idMap[f.lookupList][v];
        out[f.name + "Id"] = mapped === undefined ? null : mapped;
      } else if (f.type === "Boolean") {
        out[f.name] = !!v;
      } else if (f.type === "Number") {
        out[f.name] = v === undefined || v === null || v === "" ? null : Number(v);
      } else {
        out[f.name] = v === undefined || v === null ? "" : String(v);
      }
    }
    return out;
  }

  const failures = [];
  let inserted = 0;

  // --- マスタ（参照の依存順に投入）-----------------------------------------
  for (const o of ORDER) {
    if (o.list === "CtnNotifications" || o.list === "CtnGaiji" || o.list === "CtnAudit") continue;
    const records = DB[o.key] || [];
    for (const rec of records) {
      try {
        const created = await addItem(o.list, buildFields(o.list, rec));
        idMap[o.list][rec.id] = created.Id;
        inserted++;
      } catch (e) {
        failures.push({ where: o.list + " " + rec.id, message: e.message });
        console.error(o.list, rec.id, e.message);
      }
    }
    console.log("投入:", o.list, records.length, "件");
  }

  // --- 届（集約JSON内の参照IDも張り替える）--------------------------------
  // 子要素の内部ID（site.id / investigator.id / studyDrug.id）は Payload の
  // 中だけで意味を持つので、そのまま残す。張り替えるのはマスタへの参照のみ。
  function remapNotification(n) {
    const c = JSON.parse(JSON.stringify(n));
    c.compoundId = String(idMap.CtnCompounds[n.compoundId] ?? "");
    c.sponsorId = String(idMap.CtnSponsors[n.sponsorId] ?? "");
    for (const s of c.sites || []) {
      s.institutionId = String(idMap.CtnInstitutions[s.institutionId] ?? "");
      s.irbId = String(idMap.CtnIrbs[s.irbId] ?? "");
      if (s.crcStaffId) s.crcStaffId = String(idMap.CtnSiteStaff[s.crcStaffId] ?? "");
      for (const inv of s.investigators || []) {
        inv.doctorId = String(idMap.CtnDoctors[inv.doctorId] ?? "");
      }
    }
    return c;
  }

  for (const n of DB.notifications || []) {
    try {
      const mapped = remapNotification(n);
      const compound = (DB.compounds || []).find((x) => x.id === n.compoundId);
      const code = compound ? compound.compoundCode : "";
      const numbers = "届" + n.filingCount + (n.changeCount ? "/変" + n.changeCount : "");
      const title = (code + " " + numbers + " " + NOTIF_TYPE_SHORT[n.notifType] + "届").slice(0, 255);

      // 列の組み立てには「張り替え前」の n を渡す。buildFields が内部で
      // 旧ID→新ID を引くため、mapped（張り替え済み）を渡すと二重変換になり
      // ルックアップ列が null になる。Payload だけ mapped を使う。
      const base = buildFields("CtnNotifications", n);
      const created = await addItem("CtnNotifications", {
        ...base,
        Title: title,
        CtnPayload: JSON.stringify(mapped),
        CtnPayloadVersion: PAYLOAD_VERSION,
      });
      idMap.CtnNotifications[n.id] = created.Id;

      mapped.id = String(created.Id);
      await mergeItem(
        "CtnNotifications",
        created.Id,
        { CtnPayload: JSON.stringify(mapped) },
        created["odata.etag"] || '"1"'
      );
      inserted++;
    } catch (e) {
      failures.push({ where: "CtnNotifications " + n.id, message: e.message });
      console.error("CtnNotifications", n.id, e.message);
    }
  }
  console.log("投入: CtnNotifications", (DB.notifications || []).length, "件");

  // --- 外字履歴・監査ログ --------------------------------------------------
  for (const g of DB.gaiji || []) {
    try {
      const f = buildFields("CtnGaiji", g);
      f.Title = (g.originalChar + " → " + g.replacementChar).slice(0, 255);
      await addItem("CtnGaiji", f);
      inserted++;
    } catch (e) {
      failures.push({ where: "CtnGaiji " + g.id, message: e.message });
      console.error("CtnGaiji", g.id, e.message);
    }
  }
  console.log("投入: CtnGaiji", (DB.gaiji || []).length, "件");

  for (const a of DB.audit || []) {
    try {
      const f = buildFields("CtnAudit", a);
      f.Title = String(a.summary || "").slice(0, 255);
      await addItem("CtnAudit", f);
      inserted++;
    } catch (e) {
      failures.push({ where: "CtnAudit " + a.id, message: e.message });
      console.error("CtnAudit", a.id, e.message);
    }
  }
  console.log("投入: CtnAudit", (DB.audit || []).length, "件");

  console.log("%c--- 完了 ---", "font-weight:bold");
  console.log("投入件数:", inserted);
  if (failures.length) {
    console.warn("失敗", failures.length, "件");
    console.table(failures);
  } else {
    console.log("%c失敗はありません。ページを再読み込みしてください。", "color:green;font-weight:bold");
  }
})();
`;

await writeFile(join(PROVISION, "browser-seed.js"), script, "utf8");

const counts = ORDER.map((o) => `${o.key} ${(db[o.key] ?? []).length}`).join(" / ");
console.log(`生成: provision/browser-seed.js（${counts}）`);
