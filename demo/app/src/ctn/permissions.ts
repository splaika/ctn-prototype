// ============================================================================
// permissions.ts — ロール別の可否（起票・レビュー）
// ----------------------------------------------------------------------------
// 運用で決めた方針（2026-09-04 にクライアントと確定）:
//   - ロールは起票担当とレビュー担当の2つ。承認と薬事は置かない
//     （承認は Veeva（RIM）側で行われており、ここに置くと二重管理になる）
//   - 上位ロールは下位の操作を兼ねる（少人数運用で兼務が前提）
//   - 提出はレビュー担当。レビュー完了＝提出という1操作にした
//   - 差し戻し（review → draft）はレビュー担当以上
//   - XML プレビュー・提出パッケージ出力は読み取りのため制限しない（ここで扱わない）
//   - どのグループにも属さない利用者は閲覧のみ（viewer）
//
// 職務分離との関係: 「起票者≠レビュー完了者」はロールではなくログイン名で判定する
// 別の関門で、logic.ts の canCompleteReview が担う。レビュー担当ロールを持って
// いても自分が起票した届は自分でレビュー完了できない。ロール判定と職務分離の
// 両方を通ったときだけ提出が成立する。
//
// 強制力について: SPFx はクライアント実行のみのため、この判定もブラウザ内で
// 行われる。UI とリポジトリ層の両方から参照して書き込み経路を1箇所に集約する
// ための仕組みであり、REST を直接叩く利用者は防げない（sharepointRepository.ts
// 冒頭の「二層検証について」と同じトレードオフ）。
// ============================================================================

/** アプリのロール。viewer はどのサイトグループにも属さない利用者 */
export type CtnRole = "viewer" | "drafter" | "reviewer";

/**
 * 権限の強さ。ワークフローの順序（起票 → レビュー）に沿って上位が下位を兼ねる。
 * レビュー担当は起票もできる（少人数運用のため兼務を許す）。
 */
const RANK: Record<CtnRole, number> = {
  viewer: 0,
  drafter: 1,
  reviewer: 2,
};

export const ROLE_LABEL: Record<CtnRole, [string, string]> = {
  viewer: ["Viewer", "閲覧のみ"],
  drafter: ["Drafter", "起票担当"],
  reviewer: ["Reviewer", "レビュー担当"],
};

/** ロール判定の対象となる操作 */
export type CtnAction =
  | "createNotification"
  | "editNotification"
  | "deleteNotification"
  | "sendForReview"
  | "rejectNotification"
  | "submitNotification"
  | "editMasterData";

/** 各操作に必要な最低ロール。これ以上のランクなら実行できる */
const MIN_ROLE: Record<CtnAction, CtnRole> = {
  createNotification: "drafter",
  editNotification: "drafter",
  deleteNotification: "drafter",
  sendForReview: "drafter",
  rejectNotification: "reviewer",
  // レビュー完了＝提出。起票者本人は職務分離（logic.ts）で別途止まる
  submitNotification: "reviewer",
  editMasterData: "reviewer",
};

/**
 * ランク比較ではなく「そのロールちょうど」を要求する操作。現在は空。
 */
const ROLE_EXACT: Partial<Record<CtnAction, CtnRole>> = {};

const ACTION_LABEL: Record<CtnAction, string> = {
  createNotification: "届の起票",
  editNotification: "届の編集",
  deleteNotification: "届の削除",
  sendForReview: "レビュー送付",
  rejectNotification: "差し戻し",
  submitNotification: "レビュー完了・提出",
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
