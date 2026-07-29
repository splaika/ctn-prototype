// ============================================================================
// roleResolver.ts — SharePoint グループ → アプリのロール
// ----------------------------------------------------------------------------
// 職務分離（起票者≠承認者）の同一性判定はログイン名で行うが、UI が出し分ける
// 権限（承認ボタン等）はロールで決まる。ロールは SharePoint のサイトグループ
// 所属から引く（provision-lists.ps1 が4グループを作成する）。
//
// ロールをリストで持たずグループにした理由: 権限管理を SharePoint 側へ寄せられ、
// サイト所有者権限だけで運用できる。ユーザー管理が二重にならない。
// ============================================================================
import listSchema from "../../provision/ctn-lists.schema.json";
import type { DemoUser } from "../shared/ctn/refData";

export type CtnRole = DemoUser["role"];

/** 複数所属していたときの優先順位（強い権限を優先） */
const ROLE_PRIORITY: CtnRole[] = ["approver", "regulatory", "reviewer", "drafter"];

/** グループ名 → ロール（provision/ctn-lists.schema.json の groups が単一ソース） */
const GROUP_TO_ROLE = new Map<string, CtnRole>(
  listSchema.groups.map((g) => [g.name, g.role as CtnRole])
);

/**
 * 所属グループ名からロールを決める。
 * どのグループにも属さない場合は最小権限の drafter とする（承認はできない）。
 */
export function resolveRole(groupNames: string[]): CtnRole {
  const matched = groupNames
    .map((n) => GROUP_TO_ROLE.get(n))
    .filter((r): r is CtnRole => r !== undefined);
  if (matched.length === 0) return "drafter";
  for (const role of ROLE_PRIORITY) {
    if (matched.indexOf(role) >= 0) return role;
  }
  return "drafter";
}

/** プロビジョニングが作るグループ名（README・スクリプトと突き合わせる用） */
export const CTN_GROUP_NAMES: string[] = listSchema.groups.map((g) => g.name);
