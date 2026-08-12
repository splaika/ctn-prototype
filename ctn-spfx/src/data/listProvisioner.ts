// ============================================================================
// listProvisioner.ts — リスト・列・グループをブラウザから作る
// ----------------------------------------------------------------------------
// provision-lists.ps1 と同じことを SharePoint REST で行う。いずれの操作も
// サイト所有者の権限で通るため、テナント管理者も PnP.PowerShell も不要になる。
// （PnP.PowerShell 2.x は対話ログインに Entra ID のアプリ登録を要求し、その
//   作成にテナント管理者の同意が必要 — それを回避するのが本モジュールの目的）
//
// 単一ソースは provision/ctn-lists.schema.json。PowerShell 版・対応表・
// リポジトリの列名と同じ定義から Field XML を組み立てる。
//
// 冪等: 既にあるリスト・列・グループは作り直さない。既存列の型変更もしない。
// ============================================================================
import listSchema from "../../provision/ctn-lists.schema.json";
import type { ISpProvisioningClient } from "./spClient";

interface ISchemaField {
  prop: string;
  name: string;
  type: string;
  builtIn?: boolean;
  required?: boolean;
  choices?: string[];
  lookupList?: string;
  note?: string;
}
interface ISchemaList {
  name: string;
  title: string;
  entity: string;
  description: string;
  appendOnly?: boolean;
  fields: ISchemaField[];
}

const LISTS = listSchema.lists as ISchemaList[];
const GROUPS = listSchema.groups as { name: string; role: string; description: string }[];

/** 進捗表示用。UI がそのまま出せる粒度にしてある */
export interface IProvisionProgress {
  /** 人が読める現在の作業 */
  step: string;
  done: number;
  total: number;
}

export interface IProvisionResult {
  listsCreated: string[];
  listsExisting: string[];
  fieldsCreated: number;
  fieldsExisting: number;
  groupsCreated: string[];
  groupsExisting: string[];
  /** 続行はしたが個別に失敗したもの（列単位）。空なら完全成功 */
  failures: { where: string; message: string }[];
}

/** XML 属性値のエスケープ。選択肢に日本語や記号が入るため必須 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 列1つ分の Field XML を組み立てる。
 * 必須性はリポジトリ層（logic.ts の検証）で担保するため、列側は全て任意にする。
 * SharePoint 側で必須にすると下書き保存（一部未入力）が通らなくなる。
 */
export function buildFieldXml(f: ISchemaField, lookupTargetId?: string): string {
  const base = `DisplayName="${esc(f.name)}" Name="${esc(f.name)}" StaticName="${esc(f.name)}" Required="FALSE"`;
  switch (f.type) {
    case "Text":
      return `<Field Type="Text" ${base} MaxLength="255" />`;
    case "Note":
      // RichText="FALSE" = プレーンテキスト。集約JSONを入れるので装飾は不要
      return `<Field Type="Note" ${base} NumLines="6" RichText="FALSE" AppendOnly="FALSE" />`;
    case "Number":
      return `<Field Type="Number" ${base} />`;
    case "Boolean":
      return `<Field Type="Boolean" ${base} />`;
    case "Choice": {
      const choices = (f.choices ?? []).map((c) => `<CHOICE>${esc(c)}</CHOICE>`).join("");
      return `<Field Type="Choice" ${base} Format="Dropdown"><CHOICES>${choices}</CHOICES></Field>`;
    }
    case "Lookup": {
      if (!lookupTargetId) {
        throw new Error(`参照列 ${f.name} の対象リスト「${f.lookupList}」の ID が解決できませんでした。`);
      }
      // List 属性は波括弧付きの GUID
      return `<Field Type="Lookup" ${base} List="{${lookupTargetId}}" ShowField="Title" />`;
    }
    default:
      throw new Error(`未対応の列型です: ${f.type}（列 ${f.name}）`);
  }
}

/** リストが揃っているかだけを調べる（セットアップ画面の出し分けに使う） */
export async function checkProvisioning(
  sp: ISpProvisioningClient
): Promise<{ missing: string[]; existing: string[] }> {
  const present = new Set((await sp.getLists()).map((l) => l.title));
  const missing: string[] = [];
  const existing: string[] = [];
  for (const l of LISTS) {
    if (present.has(l.name)) existing.push(l.name);
    else missing.push(l.name);
  }
  return { missing, existing };
}

/**
 * リスト・列・グループを作る。冪等。
 * 参照列の解決に全リストの GUID が必要なため、リストを先に全部作る2段構成。
 */
export async function provisionCtnLists(
  sp: ISpProvisioningClient,
  onProgress?: (p: IProvisionProgress) => void
): Promise<IProvisionResult> {
  const result: IProvisionResult = {
    listsCreated: [],
    listsExisting: [],
    fieldsCreated: 0,
    fieldsExisting: 0,
    groupsCreated: [],
    groupsExisting: [],
    failures: [],
  };

  const fieldTotal = LISTS.reduce((n, l) => n + l.fields.filter((f) => !f.builtIn).length, 0);
  const total = LISTS.length + fieldTotal + GROUPS.length;
  let done = 0;
  const tick = (step: string): void => {
    done++;
    if (onProgress) onProgress({ step, done, total });
  };

  // --- 第1段階: リスト（参照列の解決に先立って全リストが必要） ---
  const existingLists = new Map((await sp.getLists()).map((l) => [l.title, l.id]));
  for (const l of LISTS) {
    if (existingLists.has(l.name)) {
      result.listsExisting.push(l.name);
      try {
        await sp.updateListSettings(l.name, l.description);
      } catch (e) {
        // 設定の揃え直しに失敗しても、リスト自体はあるので続行する
        result.failures.push({ where: `リスト設定 ${l.name}`, message: (e as Error).message });
      }
      tick(`既存のリストを確認: ${l.name}`);
      continue;
    }
    const created = await sp.createList(l.name, l.description);
    existingLists.set(l.name, created.id);
    result.listsCreated.push(l.name);
    tick(`リストを作成: ${l.name}`);
  }

  // 参照列の対象 ID を確定させる（作成応答が ID を返さない場合に備えて再取得）
  const needsRefetch = [...existingLists.values()].some((id) => !id);
  if (needsRefetch) {
    for (const l of await sp.getLists()) existingLists.set(l.title, l.id);
  }

  // --- 第2段階: 列 ---
  for (const l of LISTS) {
    const present = new Set(await sp.getFieldInternalNames(l.name));
    for (const f of l.fields) {
      if (f.builtIn) continue; // Title 等の既定列は作らない
      if (present.has(f.name)) {
        result.fieldsExisting++;
        tick(`既存の列を確認: ${l.name}.${f.name}`);
        continue;
      }
      try {
        const targetId = f.type === "Lookup" ? existingLists.get(f.lookupList ?? "") : undefined;
        await sp.createFieldAsXml(l.name, buildFieldXml(f, targetId), true);
        result.fieldsCreated++;
      } catch (e) {
        // 1列の失敗で全体を止めない。最後にまとめて報告する
        result.failures.push({ where: `${l.name}.${f.name}`, message: (e as Error).message });
      }
      tick(`列を作成: ${l.name}.${f.name}`);
    }
  }

  // --- 第3段階: ロール用サイトグループ（メンバー追加は運用側で行う） ---
  const presentGroups = new Set(await sp.getSiteGroupNames());
  for (const g of GROUPS) {
    if (presentGroups.has(g.name)) {
      result.groupsExisting.push(g.name);
      tick(`既存のグループを確認: ${g.name}`);
      continue;
    }
    try {
      await sp.createSiteGroup(g.name, g.description);
      result.groupsCreated.push(g.name);
    } catch (e) {
      result.failures.push({ where: `グループ ${g.name}`, message: (e as Error).message });
    }
    tick(`グループを作成: ${g.name}`);
  }

  return result;
}
