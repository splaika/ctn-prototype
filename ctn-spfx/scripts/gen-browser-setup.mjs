// ============================================================================
// gen-browser-setup.mjs — ブラウザのコンソールに貼るセットアップスクリプトを生成
// ----------------------------------------------------------------------------
// 単一ソース: provision/ctn-lists.schema.json
// 生成物:     provision/browser-setup.js
//
// 用途: Web パーツを再デプロイせずにリストを作りたいとき。SharePoint の
// サイトを開いた状態で F12 → Console に貼り付けて実行する。サインイン
// ユーザーの権限で動くため、サイト所有者なら管理者権限は不要。
//
// listProvisioner.ts（Web パーツ内のセットアップ画面）と同じ処理・同じ
// スキーマだが、こちらは配置済みのコードに依存しないので先に実行できる。
//
//   node scripts/gen-browser-setup.mjs
// ============================================================================
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROVISION = join(ROOT, "provision");

const schema = JSON.parse(await readFile(join(PROVISION, "ctn-lists.schema.json"), "utf8"));

// スキーマから、スクリプトが必要とする分だけを抜き出して埋め込む
const payload = {
  lists: schema.lists.map((l) => ({
    name: l.name,
    description: l.description,
    fields: l.fields
      .filter((f) => !f.builtIn)
      .map((f) => ({
        name: f.name,
        type: f.type,
        choices: f.choices,
        lookupList: f.lookupList,
      })),
  })),
  groups: schema.groups.map((g) => ({ name: g.name, description: g.description })),
};

const script = `// ===========================================================================
// CTN Suite — リスト作成スクリプト（ブラウザのコンソール用・自動生成）
// ---------------------------------------------------------------------------
// このファイルは scripts/gen-browser-setup.mjs が
// provision/ctn-lists.schema.json から生成します。直接編集しないでください。
//
// 使い方:
//   1. 対象の SharePoint サイトをブラウザで開く
//   2. F12 → Console タブ
//   3. このファイルの中身を全部貼り付けて Enter
//
// サインインユーザーの権限で動きます。サイト所有者なら管理者権限は不要です。
// 冪等です。既にあるリスト・列・グループは作り直しません。
// ===========================================================================
(async () => {
  const SCHEMA = ${JSON.stringify(payload, null, 2)};

  // --- サイトURLの解決 -----------------------------------------------------
  const ctx = window._spPageContextInfo;
  const web = (ctx && ctx.webAbsoluteUrl) || location.origin + location.pathname.split("/_layouts")[0];
  if (!web || web.indexOf("http") !== 0) {
    console.error("サイトURLを判定できませんでした。SharePoint のページ上で実行してください。");
    return;
  }
  console.log("%cCTN Suite セットアップ", "font-weight:bold;font-size:14px");
  console.log("対象サイト:", web);

  // --- 書き込みに必要なフォームダイジェスト --------------------------------
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

  const jsonHeaders = {
    Accept: "application/json;odata=minimalmetadata",
    "Content-Type": "application/json;odata=verbose",
    "X-RequestDigest": digest,
  };

  async function get(url) {
    const r = await fetch(url, {
      headers: { Accept: "application/json;odata=minimalmetadata" },
      credentials: "same-origin",
    });
    if (!r.ok) throw new Error("GET " + url + " → HTTP " + r.status + " " + (await r.text()).slice(0, 300));
    return r.json();
  }
  async function post(url, body) {
    const r = await fetch(url, {
      method: "POST",
      headers: jsonHeaders,
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error("POST " + url + " → HTTP " + r.status + " " + (await r.text()).slice(0, 300));
    try {
      return await r.json();
    } catch (e) {
      return undefined;
    }
  }

  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  function fieldXml(f, lookupId) {
    const base =
      'DisplayName="' + esc(f.name) + '" Name="' + esc(f.name) + '" StaticName="' + esc(f.name) + '" Required="FALSE"';
    if (f.type === "Text") return "<Field Type=\\"Text\\" " + base + ' MaxLength="255" />';
    if (f.type === "Note")
      return "<Field Type=\\"Note\\" " + base + ' NumLines="6" RichText="FALSE" AppendOnly="FALSE" />';
    if (f.type === "Number") return "<Field Type=\\"Number\\" " + base + " />";
    if (f.type === "Boolean") return "<Field Type=\\"Boolean\\" " + base + " />";
    if (f.type === "Choice") {
      const c = (f.choices || []).map((x) => "<CHOICE>" + esc(x) + "</CHOICE>").join("");
      return "<Field Type=\\"Choice\\" " + base + ' Format="Dropdown"><CHOICES>' + c + "</CHOICES></Field>";
    }
    if (f.type === "Lookup") {
      if (!lookupId) throw new Error("参照先リストのIDが未解決: " + f.name + " → " + f.lookupList);
      return "<Field Type=\\"Lookup\\" " + base + ' List="{' + lookupId + '}" ShowField="Title" />';
    }
    throw new Error("未対応の列型: " + f.type + "（" + f.name + "）");
  }

  const failures = [];
  let listsCreated = 0;
  let fieldsCreated = 0;
  let fieldsExisting = 0;
  let groupsCreated = 0;

  // --- 第1段階: リスト（参照列の解決に先立って全リストが必要） -------------
  const listIds = new Map();
  for (const l of (await get(web + "/_api/web/lists?$select=Title,Id&$top=500")).value) {
    listIds.set(l.Title, l.Id);
  }

  for (const l of SCHEMA.lists) {
    if (listIds.has(l.name)) {
      console.log("既存のリスト:", l.name);
      continue;
    }
    try {
      const created = await post(web + "/_api/web/lists", {
        __metadata: { type: "SP.List" },
        Title: l.name,
        Description: l.description,
        BaseTemplate: 100,
        EnableVersioning: true,
      });
      const id = created && (created.Id || (created.d && created.d.Id));
      listIds.set(l.name, id);
      listsCreated++;
      console.log("%cリストを作成:", "color:green", l.name);
    } catch (e) {
      failures.push({ where: "リスト " + l.name, message: e.message });
      console.error("リスト作成に失敗:", l.name, e.message);
    }
  }

  // 作成応答がIDを返さない場合に備えて再取得
  if ([...listIds.values()].some((v) => !v)) {
    for (const l of (await get(web + "/_api/web/lists?$select=Title,Id&$top=500")).value) {
      listIds.set(l.Title, l.Id);
    }
  }

  // --- 第2段階: 列 ---------------------------------------------------------
  for (const l of SCHEMA.lists) {
    if (!listIds.get(l.name)) {
      console.warn("リストが無いため列作成をスキップ:", l.name);
      continue;
    }
    const listApi = web + "/_api/web/lists/getbytitle('" + encodeURIComponent(l.name) + "')";
    let present;
    try {
      present = new Set(
        (await get(listApi + "/fields?$select=InternalName&$top=500")).value.map((f) => f.InternalName)
      );
    } catch (e) {
      failures.push({ where: "列一覧 " + l.name, message: e.message });
      continue;
    }

    for (const f of l.fields) {
      if (present.has(f.name)) {
        fieldsExisting++;
        continue;
      }
      try {
        const xml = fieldXml(f, f.type === "Lookup" ? listIds.get(f.lookupList) : undefined);
        await post(listApi + "/fields/createfieldasxml", {
          parameters: {
            __metadata: { type: "SP.XmlSchemaFieldCreationInformation" },
            SchemaXml: xml,
            Options: 8, // AddFieldToDefaultView
          },
        });
        fieldsCreated++;
        console.log("  列を作成:", l.name + "." + f.name);
      } catch (e) {
        failures.push({ where: l.name + "." + f.name, message: e.message });
        console.error("  列作成に失敗:", l.name + "." + f.name, e.message);
      }
    }
  }

  // --- 第3段階: ロール用サイトグループ -------------------------------------
  let presentGroups = new Set();
  try {
    presentGroups = new Set(
      (await get(web + "/_api/web/sitegroups?$select=Title&$top=500")).value.map((g) => g.Title)
    );
  } catch (e) {
    failures.push({ where: "グループ一覧", message: e.message });
  }
  for (const g of SCHEMA.groups) {
    if (presentGroups.has(g.name)) {
      console.log("既存のグループ:", g.name);
      continue;
    }
    try {
      await post(web + "/_api/web/sitegroups", {
        __metadata: { type: "SP.Group" },
        Title: g.name,
        Description: g.description,
      });
      groupsCreated++;
      console.log("%cグループを作成:", "color:green", g.name);
    } catch (e) {
      failures.push({ where: "グループ " + g.name, message: e.message });
      console.error("グループ作成に失敗:", g.name, e.message);
    }
  }

  // --- 結果 ---------------------------------------------------------------
  console.log("%c--- 完了 ---", "font-weight:bold");
  console.log("リスト作成:", listsCreated, "/ 想定", SCHEMA.lists.length);
  console.log("列作成:", fieldsCreated, "既存:", fieldsExisting);
  console.log("グループ作成:", groupsCreated, "/ 想定", SCHEMA.groups.length);
  if (failures.length) {
    console.warn("失敗", failures.length, "件（もう一度実行すると不足分だけ再試行します）");
    console.table(failures);
  } else {
    console.log("%c失敗はありません。ページを再読み込みしてください。", "color:green;font-weight:bold");
  }
})();
`;

await writeFile(join(PROVISION, "browser-setup.js"), script, "utf8");

const fieldCount = payload.lists.reduce((n, l) => n + l.fields.length, 0);
console.log(
  `生成: provision/browser-setup.js（${payload.lists.length} リスト・${fieldCount} 列・${payload.groups.length} グループ）`
);
