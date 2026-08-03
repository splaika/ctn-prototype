// ===========================================================================
// AUTO-GENERATED — 手編集禁止
// scripts/sync-from-demo.mjs が demo/app/src から生成。再同期で上書きされます。
// 変更は単一ソース demo/app/src/ctn/permissions.ts 側で行ってください。
// ===========================================================================
// ============================================================================
// permissions.ts — ロール別の可否（起票・レビュー・承認・薬事）
// ----------------------------------------------------------------------------
// 運用で決めた方針:
//   - 上位ロールは下位の操作を兼ねる（少人数運用で兼務が前提）
//   - 提出は薬事のみ
//   - 差し戻し（review → draft）はレビュー担当以上
//   - XML プレビュー・提出パッケージ出力は読み取りのため制限しない（ここで扱わない）
//   - どのグループにも属さない利用者は閲覧のみ（viewer）
//
// 職務分離との関係: 「起票者≠承認者」はロールではなくログイン名で判定する
// 別の関門で、logic.ts の canApprove が担う。承認者ロールを持っていても自分が
// 起票した届は承認できない。ロール判定と職務分離の両方を通ったときだけ承認が
// 成立する。
//
// 強制力について: SPFx はクライアント実行のみのため、この判定もブラウザ内で
// 行われる。UI とリポジトリ層の両方から参照して書き込み経路を1箇所に集約する
// ための仕組みであり、REST を直接叩く利用者は防げない（sharepointRepository.ts
// 冒頭の「二層検証について」と同じトレードオフ）。
// ============================================================================

/** アプリのロール。viewer はどのサイトグループにも属さない利用者 */
export type CtnRole = "viewer" | "drafter" | "reviewer" | "approver" | "regulatory";

/**
 * 権限の強さ。ワークフローの順序（起票 → レビュー → 承認 → 薬事）に沿って
 * 上位が下位を兼ねる。
 *
 * ※ 要確認: この並びは薬事担当を最上位に置くため、薬事担当は承認もできる。
 *   承認を承認者だけに閉じたい場合は approveNotification の必要ロールを
 *   ランク比較ではなく approver 固定に変える（下の ROLE_EXACT を参照）。
 */
const RANK: Record<CtnRole, number> = {
  viewer: 0,
  drafter: 1,
  reviewer: 2,
  approver: 3,
  regulatory: 4,
};

export const ROLE_LABEL: Record<CtnRole, [string, string]> = {
  viewer: ["Viewer", "閲覧のみ"],
  drafter: ["Drafter", "起票担当"],
  reviewer: ["Reviewer", "レビュー担当"],
  approver: ["Approver", "承認者"],
  regulatory: ["Regulatory", "薬事担当"],
};

/** ロール判定の対象となる操作 */
export type CtnAction =
  | "createNotification"
  | "editNotification"
  | "deleteNotification"
  | "sendForReview"
  | "rejectNotification"
  | "approveNotification"
  | "submitNotification"
  | "editMasterData";

/** 各操作に必要な最低ロール。これ以上のランクなら実行できる */
const MIN_ROLE: Record<CtnAction, CtnRole> = {
  createNotification: "drafter",
  editNotification: "drafter",
  deleteNotification: "drafter",
  sendForReview: "drafter",
  rejectNotification: "reviewer",
  approveNotification: "approver",
  submitNotification: "regulatory",
  editMasterData: "regulatory",
};

/**
 * ランク比較ではなく「そのロールちょうど」を要求する操作。
 * 現在は空。承認を承認者だけに閉じるなら "approveNotification" を足す。
 */
const ROLE_EXACT: Partial<Record<CtnAction, CtnRole>> = {};

const ACTION_LABEL: Record<CtnAction, string> = {
  createNotification: "届の起票",
  editNotification: "届の編集",
  deleteNotification: "届の削除",
  sendForReview: "レビュー送付",
  rejectNotification: "差し戻し",
  approveNotification: "承認",
  submitNotification: "提出",
  editMasterData: "マスタ・設定の変更",
};

/** その操作を実行できるか */
export function can(role: CtnRole, action: CtnAction): boolean {
  const exact = ROLE_EXACT[action];
  if (exact) return role === exact;
  return RANK[role] >= RANK[MIN_ROLE[action]];
}

/**
 * 可否と、不可のときの理由。UI のツールチップとリポジトリ層の例外で
 * 同じ文言を使う（利用者が見るメッセージを1箇所に保つ）。
 */
export function requirePermission(role: CtnRole, action: CtnAction): { ok: boolean; reason?: string } {
  if (can(role, action)) return { ok: true };
  const exact = ROLE_EXACT[action];
  const needed = exact ?? MIN_ROLE[action];
  const neededLabel = ROLE_LABEL[needed][1];
  const suffix = exact ? `${neededLabel}のみが行えます` : `${neededLabel}以上の権限が必要です`;
  return {
    ok: false,
    reason: `権限がありません：${ACTION_LABEL[action]}は${suffix}。現在のロールは「${ROLE_LABEL[role][1]}」です。`,
  };
}

/** リポジトリ層用。不可なら投げる */
export function assertPermission(role: CtnRole, action: CtnAction): void {
  const check = requirePermission(role, action);
  if (!check.ok) throw new Error(check.reason);
}
