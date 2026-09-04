// ============================================================================
// roleResolver.ts — SharePoint グループ → アプリのロール
// ----------------------------------------------------------------------------
// 職務分離（起票者≠レビュー完了者）の同一性判定はログイン名で行うが、UI が
// 出し分ける権限（レビュー完了・提出ボタン等）はロールで決まる。ロールは
// SharePoint のサイトグループ所属から引く（provision-lists.ps1 が2グループを作成する）。
//
// ロールをリストで持たずグループにした理由: 権限管理を SharePoint 側へ寄せられ、
// サイト所有者権限だけで運用できる。ユーザー管理が二重にならない。
// ============================================================================
import listSchema from "../../provision/ctn-lists.schema.json";
import type { CtnRole } from "../shared/ctn/permissions";

export type { CtnRole };

/**
 * 複数所属していたときの優先順位（強い権限を優先）。
 * permissions.ts のランク（起票 < レビュー）と並びを一致させる。
 */
const ROLE_PRIORITY: CtnRole[] = ["reviewer", "drafter"];

/** グループ名 → ロール（provision/ctn-lists.schema.json の groups が単一ソース） */
const GROUP_TO_ROLE = new Map<string, CtnRole>(
  listSchema.groups.map((g) => [g.name, g.role as CtnRole])
);

/**
 * 所属グループ名からロールを決める。
 * どのグループにも属さない場合は viewer（閲覧のみ）とする。サイトを見られる
 * だけの利用者が届を起票できてしまわないようにするため。
 */
export function resolveRole(groupNames: string[]): CtnRole {
  const matched = groupNames
    .map((n) => GROUP_TO_ROLE.get(n))
    .filter((r): r is CtnRole => r !== undefined);
  if (matched.length === 0) return "viewer";
  for (const role of ROLE_PRIORITY) {
    if (matched.indexOf(role) >= 0) return role;
  }
  return "viewer";
}

/** プロビジョニングが作るグループ名（README・スクリプトと突き合わせる用） */
export const CTN_GROUP_NAMES: string[] = listSchema.groups.map((g) => g.name);
