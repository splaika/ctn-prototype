// ============================================================================
// gen-provision.mjs — リスト定義から対応表とプロビジョニングスクリプトを生成
// ----------------------------------------------------------------------------
// 単一ソース: provision/ctn-lists.schema.json
// 生成物:
//   provision/columns.md           … types.ts プロパティ → リスト列 の対応表
//   provision/provision-lists.ps1  … PnP.PowerShell による冪等プロビジョニング
//
// 手で両方を保守するとズレるため生成にしている（ブリーフ Phase 3 の受け入れ基準
// 「スクリプトが columns.md と1:1で対応」を構造的に満たす）。
//
//   node scripts/gen-provision.mjs
// ============================================================================
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROVISION = join(ROOT, "provision");
const SCHEMA_PATH = join(PROVISION, "ctn-lists.schema.json");

const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8"));

const GENERATED_BY = "scripts/gen-provision.mjs";

/** SharePoint の型名（表示用） */
const TYPE_LABEL = {
  Text: "1行テキスト",
  Note: "複数行テキスト（プレーン）",
  Number: "数値",
  Boolean: "はい/いいえ",
  Choice: "選択肢",
  Lookup: "参照",
};

// ---------------------------------------------------------------------------
// columns.md
// ---------------------------------------------------------------------------
function renderColumnsMd() {
  const out = [];
  out.push("# リスト列 対応表（自動生成）");
  out.push("");
  out.push(`> このファイルは \`${GENERATED_BY}\` が \`provision/ctn-lists.schema.json\` から生成します。`);
  out.push("> 直接編集しないでください。列を変えるときはスキーマJSONを直して再生成します。");
  out.push("");
  out.push("`demo/app/src/ctn/types.ts` のプロパティと SharePoint リスト列の対応です。");
  out.push("");
  out.push("## 規則");
  out.push("");
  out.push("- 内部名は `Ctn` プレフィックス必須（`Level` / `Status` / `Owner` 等の予約名との衝突回避）");
  out.push("- 日付は **1行テキスト**で保持（SharePoint の日付型はタイムゾーンでずれるため）");
  out.push("- 数値 choice は数値列、文字列 union は選択肢列");
  out.push("- 論理削除は `CtnActive`（はい/いいえ）。物理削除は実装しない");
  out.push("- `Title` は一覧の可読性のためリポジトリが組み立てて入れる表示名");
  out.push("- 参照列への書き込みは `{内部名}Id`（例 `CtnCompoundId`）に数値で行う");
  out.push("- 全リストでバージョン管理を有効化する");
  out.push("");
  out.push("## ロール用 SharePoint グループ");
  out.push("");
  out.push("ロールはリストではなくサイトグループの所属から解決します（`src/data/roleResolver.ts`）。");
  out.push("");
  out.push("| グループ名 | ロール | 用途 |");
  out.push("| --- | --- | --- |");
  for (const g of schema.groups) {
    out.push(`| ${g.name} | \`${g.role}\` | ${g.description} |`);
  }
  out.push("");
  out.push("どのグループにも属さないユーザーは最小権限の `drafter` として扱われます（承認はできません）。");
  out.push("");

  for (const list of schema.lists) {
    out.push(`## ${list.name}`);
    out.push("");
    out.push(`**表示名**: ${list.title}　**対応する型**: \`${list.entity}\``);
    out.push("");
    out.push(list.description);
    if (list.appendOnly) {
      out.push("");
      out.push("> 追記専用。リポジトリに更新・削除メソッドを実装していません。");
    }
    out.push("");
    out.push("| `types.ts` プロパティ | 内部名 | 型 | 備考 |");
    out.push("| --- | --- | --- | --- |");
    for (const f of list.fields) {
      const type = f.type === "Choice"
        ? `${TYPE_LABEL.Choice}（${f.choices.join(" / ")}）`
        : f.type === "Lookup"
          ? `${TYPE_LABEL.Lookup} → \`${f.lookupList}\``
          : TYPE_LABEL[f.type];
      const notes = [];
      if (f.builtIn) notes.push("既定列");
      if (f.required === false) notes.push("任意");
      if (f.note) notes.push(f.note);
      const prop = f.prop.startsWith("(") ? f.prop : `\`${f.prop}\``;
      out.push(`| ${prop} | \`${f.name}\` | ${type} | ${notes.join("。") || "—"} |`);
    }
    out.push("");
  }

  out.push("## `id` の扱い");
  out.push("");
  out.push("ドメイン型の `id` は文字列ですが、SharePoint の項目 ID は数値です。");
  out.push("変換は `sharepointRepository.ts` の境界で完結し、UI へは数値を漏らしません。");
  out.push("そのため各リストに `CtnId` のような列は作りません（`Id` をそのまま使います）。");
  out.push("");
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// provision-lists.ps1
// ---------------------------------------------------------------------------
const psStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

function fieldXml(f) {
  // 参照列は Add-PnPField が対象リストを直接取れないため Field XML で作る。
  // List 属性は実行時に解決した対象リストの GUID を波括弧付きで書く必要がある。
  // PowerShell の -f は {{ }} を波括弧のリテラルに展開するので {{{0}}} と書く。
  // 必須性はリポジトリ層（logic.ts の検証）で担保するため、列側は全て任意にする。
  // SharePoint 側で必須にすると、下書き保存（一部未入力）が通らなくなる。
  return (
    `<Field Type="Lookup" DisplayName="${f.name}" Name="${f.name}" StaticName="${f.name}"` +
    ` Required="FALSE" List="{{{0}}}" ShowField="Title" />`
  );
}

function renderProvisionPs1() {
  const out = [];
  out.push("# ===========================================================================");
  out.push("# provision-lists.ps1 — CTN Suite の SharePoint リストを作成する（自動生成）");
  out.push("# ---------------------------------------------------------------------------");
  out.push(`# このファイルは ${GENERATED_BY} が provision/ctn-lists.schema.json から`);
  out.push("# 生成します。直接編集しないでください。");
  out.push("#");
  out.push("# 冪等です。既にあるリスト・列・グループは作り直さず、足りないものだけ足します。");
  out.push("# 既存列の型変更は行いません（データ損失を避けるため）。型を変えたい場合は");
  out.push("# 対象列を手で削除してから再実行してください。");
  out.push("#");
  out.push("# 前提: PnP.PowerShell");
  out.push("#   Install-Module PnP.PowerShell -Scope CurrentUser");
  out.push("#");
  out.push("# 実行例:");
  out.push("#   .\\provision-lists.ps1 -SiteUrl 'https://<tenant>.sharepoint.com/sites/<site>' -ClientId '<Entra アプリID>'");
  out.push("#");
  out.push("# ClientId について: PnP.PowerShell 2.x 以降は対話ログインに Entra ID の");
  out.push("# アプリ登録が必要です。用意が無い場合は Register-PnPEntraIDAppForInteractiveLogin");
  out.push("# で作成できます（テナント管理者の同意が必要）。");
  out.push("# ===========================================================================");
  out.push("[CmdletBinding()]");
  out.push("param(");
  out.push("    [Parameter(Mandatory = $true)][string] $SiteUrl,");
  out.push("    [Parameter(Mandatory = $true)][string] $ClientId,");
  out.push("    # 既に Connect-PnPOnline 済みのセッションで実行する場合に指定する");
  out.push("    [switch] $UseExistingConnection");
  out.push(")");
  out.push("");
  out.push("$ErrorActionPreference = 'Stop'");
  out.push("");
  out.push("if (-not $UseExistingConnection) {");
  out.push("    Write-Host \"接続中: $SiteUrl\" -ForegroundColor Cyan");
  out.push("    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId");
  out.push("}");
  out.push("");
  out.push("function Test-CtnList([string] $Title) {");
  out.push("    try { return $null -ne (Get-PnPList -Identity $Title -ErrorAction Stop) }");
  out.push("    catch { return $false }");
  out.push("}");
  out.push("");
  out.push("function Test-CtnField([string] $ListTitle, [string] $InternalName) {");
  out.push("    try { return $null -ne (Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction Stop) }");
  out.push("    catch { return $false }");
  out.push("}");
  out.push("");

  // --- Pass 1: lists ---
  out.push("# --- 第1段階: リストを作る（参照列の解決に先立って全リストが要る） ---------");
  for (const list of schema.lists) {
    out.push(`if (Test-CtnList ${psStr(list.name)}) {`);
    out.push(`    Write-Host ${psStr(`既存: ${list.name}`)} -ForegroundColor DarkGray`);
    out.push("} else {");
    out.push(`    Write-Host ${psStr(`作成: ${list.name} (${list.title})`)} -ForegroundColor Green`);
    out.push(`    New-PnPList -Title ${psStr(list.name)} -Template GenericList -OnQuickLaunch:$false | Out-Null`);
    out.push("}");
    out.push(`# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）`);
    out.push(`Set-PnPList -Identity ${psStr(list.name)} -Title ${psStr(list.name)} -Description ${psStr(list.description)} -EnableVersioning $true | Out-Null`);
    out.push("");
  }

  // --- Pass 2: fields ---
  out.push("# --- 第2段階: 列を足す -----------------------------------------------------");
  for (const list of schema.lists) {
    out.push(`Write-Host ${psStr(`列: ${list.name}`)} -ForegroundColor Cyan`);
    for (const f of list.fields) {
      if (f.builtIn) {
        out.push(`# ${f.name} は既定列のため作成不要（用途: ${f.note ?? "表示名"}）`);
        continue;
      }
      out.push(`if (Test-CtnField ${psStr(list.name)} ${psStr(f.name)}) {`);
      out.push(`    Write-Host ${psStr(`  既存: ${f.name}`)} -ForegroundColor DarkGray`);
      out.push("} else {");
      out.push(`    Write-Host ${psStr(`  追加: ${f.name}`)} -ForegroundColor Green`);
      if (f.type === "Lookup") {
        out.push(`    $targetId = (Get-PnPList -Identity ${psStr(f.lookupList)}).Id`);
        out.push(`    $xml = ${psStr(fieldXml(f))} -f $targetId`);
        out.push(`    Add-PnPFieldFromXml -List ${psStr(list.name)} -FieldXml $xml | Out-Null`);
      } else if (f.type === "Choice") {
        const choices = f.choices.map(psStr).join(", ");
        out.push(`    Add-PnPField -List ${psStr(list.name)} -DisplayName ${psStr(f.name)} -InternalName ${psStr(f.name)} -Type Choice -Choices ${choices} -AddToDefaultView | Out-Null`);
      } else {
        out.push(`    Add-PnPField -List ${psStr(list.name)} -DisplayName ${psStr(f.name)} -InternalName ${psStr(f.name)} -Type ${f.type} -AddToDefaultView | Out-Null`);
      }
      out.push("}");
    }
    out.push("");
  }

  // --- Pass 3: groups ---
  out.push("# --- 第3段階: ロール用のサイトグループ -------------------------------------");
  out.push("# ロールはこのグループ所属から解決される（src/data/roleResolver.ts）。");
  out.push("# メンバーの追加は運用側で行うこと（このスクリプトは箱だけ作る）。");
  for (const g of schema.groups) {
    out.push(`if (Get-PnPGroup -Identity ${psStr(g.name)} -ErrorAction SilentlyContinue) {`);
    out.push(`    Write-Host ${psStr(`既存グループ: ${g.name}`)} -ForegroundColor DarkGray`);
    out.push("} else {");
    out.push(`    Write-Host ${psStr(`作成グループ: ${g.name}`)} -ForegroundColor Green`);
    out.push(`    New-PnPGroup -Title ${psStr(g.name)} -Description ${psStr(g.description)} | Out-Null`);
    out.push("}");
  }
  out.push("");
  out.push("Write-Host '' ");
  out.push("Write-Host 'プロビジョニング完了。' -ForegroundColor Green");
  out.push("Write-Host '次の手順:' -ForegroundColor Cyan");
  out.push("Write-Host '  1. 各 CTN グループへ担当者を追加する（承認者は起票者と別の人にすること）'");
  out.push("Write-Host '  2. Web パーツのプロパティで データソース を「SharePoint リスト」に切り替える'");
  out.push("");

  return out.join("\n");
}

await writeFile(join(PROVISION, "columns.md"), renderColumnsMd(), "utf8");
await writeFile(join(PROVISION, "provision-lists.ps1"), renderProvisionPs1(), "utf8");

const fieldCount = schema.lists.reduce((n, l) => n + l.fields.length, 0);
console.log(`生成: provision/columns.md（${schema.lists.length} リスト・${fieldCount} 列）`);
console.log(`生成: provision/provision-lists.ps1（グループ ${schema.groups.length} 件を含む）`);
