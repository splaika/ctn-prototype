import { describe, expect, it } from "vitest";

import { MockCtnRepository } from "./data/mockRepository";
import { can, requirePermission, type CtnAction, type CtnRole } from "./permissions";

// デモ利用者（refData の USERS）: u-a 起票 / u-b レビュー / u-c 承認 / u-d 薬事
const DRAFTER = "u-a";
const REVIEWER = "u-b";
const APPROVER = "u-c";
const REGULATORY = "u-d";

describe("permissions — ロール別の可否", () => {
  // 運用で決めた表。ここが仕様の写しであり、実装が動いたらここも動かす。
  const MATRIX: Record<CtnAction, CtnRole[]> = {
    createNotification: ["drafter", "reviewer", "approver", "regulatory"],
    editNotification: ["drafter", "reviewer", "approver", "regulatory"],
    deleteNotification: ["drafter", "reviewer", "approver", "regulatory"],
    sendForReview: ["drafter", "reviewer", "approver", "regulatory"],
    rejectNotification: ["reviewer", "approver", "regulatory"],
    approveNotification: ["approver", "regulatory"],
    submitNotification: ["regulatory"],
    editMasterData: ["regulatory"],
  };
  const ALL: CtnRole[] = ["viewer", "drafter", "reviewer", "approver", "regulatory"];

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

  it("提出は薬事のみ（承認者でも不可）", () => {
    expect(can("approver", "submitNotification")).toBe(false);
    expect(can("regulatory", "submitNotification")).toBe(true);
  });

  it("不可のときは必要なロールと現在のロールを理由に含める", () => {
    const r = requirePermission("drafter", "approveNotification");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("承認者");
    expect(r.reason).toContain("起票担当");
  });

  it("可のときは理由を返さない", () => {
    expect(requirePermission("regulatory", "submitNotification")).toEqual({ ok: true });
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

  it("起票担当は承認できない（職務分離より前にロールで弾く）", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    // 起票者本人ではない起票担当でも、ロールが足りないので不可
    await expect(repo.approveNotification(id, DRAFTER)).rejects.toThrow(/承認者以上/);
  });

  it("承認者は提出できない（提出は薬事のみ）", async () => {
    const repo = new MockCtnRepository();
    const id = await draftInReview(repo);
    await repo.approveNotification(id, APPROVER);
    await expect(repo.submitNotification(id, APPROVER)).rejects.toThrow(/薬事担当以上/);
    await repo.submitNotification(id, REGULATORY);
    const db = await repo.getState();
    expect(db.notifications.find((n) => n.id === id)?.status).toBe("submitted");
  });

  it("職務分離はロールを満たしていても効く", async () => {
    const repo = new MockCtnRepository();
    const db0 = await repo.getState();
    // 承認者が自分で起票した届は、承認者ロールでも承認できない
    const n = await repo.createNotification({
      compoundId: db0.compounds[0].id,
      notifType: "change",
      createdBy: APPROVER,
    });
    await repo.sendForReview(n.id, APPROVER);
    await expect(repo.approveNotification(n.id, APPROVER)).rejects.toThrow(/職務分離/);
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
