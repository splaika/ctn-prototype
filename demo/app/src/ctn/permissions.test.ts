import { describe, expect, it } from "vitest";

import { MockCtnRepository } from "./data/mockRepository";
import { can, requirePermission, type CtnAction, type CtnRole } from "./permissions";

// デモ利用者（refData の USERS）: u-a 起票 / u-b レビュー / u-c 起票 / u-d レビュー
const DRAFTER = "u-a";
const REVIEWER = "u-b";
const REVIEWER2 = "u-d";

describe("permissions — ロール別の可否", () => {
  // 運用で決めた表。ここが仕様の写しであり、実装が動いたらここも動かす。
  const MATRIX: Record<CtnAction, CtnRole[]> = {
    createNotification: ["drafter", "reviewer"],
    editNotification: ["drafter", "reviewer"],
    deleteNotification: ["drafter", "reviewer"],
    sendForReview: ["drafter", "reviewer"],
    rejectNotification: ["reviewer"],
    submitNotification: ["reviewer"],
    editMasterData: ["reviewer"],
  };
  const ALL: CtnRole[] = ["viewer", "drafter", "reviewer"];

  for (const [action, allowed] of Object.entries(MATRIX) as [CtnAction, CtnRole[]][]) {
    for (const role of ALL) {
      const expected = allowed.indexOf(role) >= 0;
      it(`${role} は ${action} を ${expected ? "実行できる" : "実行できない"}`, () => {
        expect(can(role, action)).toBe(expected);
      });
    }
  }

  it("viewer はどの操作もできない", () => {
    for (const action of Object.keys(MATRIX) as CtnAction[]) {
      expect(can("viewer", action)).toBe(false);
    }
  });

  it("提出（レビュー完了）はレビュー担当のみ。起票担当は不可", () => {
    expect(can("drafter", "submitNotification")).toBe(false);
    expect(can("reviewer", "submitNotification")).toBe(true);
  });

  it("不可のときは必要なロールと現在のロールを理由に含める", () => {
    const r = requirePermission("drafter", "submitNotification");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("レビュー担当");
    expect(r.reason).toContain("起票担当");
  });

  it("可のときは理由を返さない", () => {
    expect(requirePermission("reviewer", "submitNotification")).toEqual({ ok: true });
  });
});

/** 起票 → レビュー送付まで進めた届の id を返す */
async function draftInReview(repo: MockCtnRepository): Promise<string> {
  const db = await repo.getState();
  const n = await repo.createNotification({
    compoundId: db.compounds[0].id,
    notifType: "change",
    createdBy: DRAFTER,
  });
  await repo.sendForReview(n.id, DRAFTER);
  return n.id;
}

describe("mockRepository — ロールの強制", () => {
  it("viewer は起票できない", async () => {
    const repo = new MockCtnRepository(() => "viewer");
    const db = await repo.getState();
    await expect(
      repo.createNotification({ compoundId: db.compounds[0].id, notifType: "change", createdBy: "unknown" })
    ).rejects.toThrow(/権限がありません/);
  });

  it("起票担当はレビュー完了・提出できない（職務分離より前にロールで弾く）", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    // 起票者本人ではない起票担当でも、ロールが足りないので不可
    await expect(repo.submitNotification(id, "u-c")).rejects.toThrow(/レビュー担当以上/);
  });

  it("レビュー担当はレビュー完了・提出でき、レビュー完了者が記録される", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    await repo.submitNotification(id, REVIEWER);
    const n = (await repo.getState()).notifications.find((x) => x.id === id)!;
    expect(n.status).toBe("submitted");
    expect(n.reviewedBy).toBe(REVIEWER);
    expect(n.reviewedAt).toBeTruthy();
  });

  it("レビュー中でない届は提出できない（提出ゲート）", async () => {
    const repo = new MockCtnRepository();
    const db0 = await repo.getState();
    const n = await repo.createNotification({
      compoundId: db0.compounds[0].id,
      notifType: "change",
      createdBy: DRAFTER,
    });
    // draft から直接は出せない
    await expect(repo.submitNotification(n.id, REVIEWER)).rejects.toThrow(/提出ゲート/);
  });

  it("職務分離はロールを満たしていても効く", async () => {
    const repo = new MockCtnRepository();
    const db0 = await repo.getState();
    // レビュー担当が自分で起票した届は、レビュー担当ロールでも自分で完了できない
    const n = await repo.createNotification({
      compoundId: db0.compounds[0].id,
      notifType: "change",
      createdBy: REVIEWER,
    });
    await repo.sendForReview(n.id, REVIEWER);
    await expect(repo.submitNotification(n.id, REVIEWER)).rejects.toThrow(/職務分離/);
    // 別のレビュー担当なら通る
    await repo.submitNotification(n.id, REVIEWER2);
    expect((await repo.getState()).notifications.find((x) => x.id === n.id)?.status).toBe("submitted");
  });
});

describe("mockRepository — 差し戻し", () => {
  it("レビュー担当が差し戻すと作成中へ戻り、理由が残る", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    await repo.rejectNotification(id, REVIEWER, "  実施計画書識別記号が未入力  ");
    const n = (await repo.getState()).notifications.find((x) => x.id === id)!;
    expect(n.status).toBe("draft");
    expect(n.rejectedBy).toBe(REVIEWER);
    expect(n.rejectionReason).toBe("実施計画書識別記号が未入力"); // 前後の空白は落とす
    expect(n.rejectedAt).toBeTruthy();
  });

  it("再度レビュー送付すると差し戻しの記録は消える", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    await repo.rejectNotification(id, REVIEWER, "要修正");
    await repo.sendForReview(id, DRAFTER);
    const n = (await repo.getState()).notifications.find((x) => x.id === id)!;
    expect(n.status).toBe("review");
    expect(n.rejectionReason).toBeUndefined();
    expect(n.rejectedBy).toBeUndefined();
    expect(n.rejectedAt).toBeUndefined();
  });

  it("起票担当は差し戻せない", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    await expect(repo.rejectNotification(id, DRAFTER, "要修正")).rejects.toThrow(/レビュー担当以上/);
  });

  it("理由が空なら差し戻せない", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    await expect(repo.rejectNotification(id, REVIEWER, "   ")).rejects.toThrow(/理由/);
  });

  it("レビュー中以外は差し戻せない", async () => {
    const repo = new MockCtnRepository();
    const db = await repo.getState();
    const n = await repo.createNotification({
      compoundId: db.compounds[0].id,
      notifType: "change",
      createdBy: DRAFTER,
    });
    await expect(repo.rejectNotification(n.id, REVIEWER, "要修正")).rejects.toThrow(/レビュー中/);
  });
});
