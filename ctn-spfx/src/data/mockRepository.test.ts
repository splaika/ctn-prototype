// ============================================================================
// mockRepository.test.ts — mock 実装の保存経路の検証
// ----------------------------------------------------------------------------
// logic.test.ts は純粋関数だけを見ており、リポジトリ経由の保存・承認・提出は
// どのテストも通っていなかった（logic.ts への採番抽出で壊しても気付けない）。
// UI の「保存」ボタンが辿る経路をここで押さえる。
// ============================================================================
import { describe, expect, it } from "vitest";

import { MockCtnRepository } from "../shared/ctn/data/mockRepository";
import type { CtnDb } from "../shared/ctn/data/repository";
import type { Notification } from "../shared/ctn/types";

async function firstCompoundId(repo: MockCtnRepository): Promise<string> {
  const db = await repo.getState();
  return db.compounds[0].id;
}
const find = (db: CtnDb, id: string): Notification | undefined =>
  db.notifications.find((n) => n.id === id);

describe("mock: 保存（UI の保存ボタンが辿る経路）", () => {
  it("シードを読み込める", async () => {
    const db = await new MockCtnRepository().getState();
    expect(db.notifications.length).toBeGreaterThan(0);
    expect(db.compounds.length).toBeGreaterThan(0);
  });

  it("新規届を作成できる", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);

    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "u-a" });
    expect(n.id).toBeTruthy();
    expect(n.status).toBe("draft");

    const db = await repo.getState();
    expect(find(db, n.id)).toBeDefined();
  });

  it("作成した届を保存でき、変更が反映される", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "u-a" });

    const saved = await repo.updateNotification({ ...n, protocolNo: "P-EDIT", objectives: "目的を編集" }, "u-a");
    expect(saved.protocolNo).toBe("P-EDIT");

    const db = await repo.getState();
    expect(find(db, n.id)?.protocolNo).toBe("P-EDIT");
    expect(find(db, n.id)?.objectives).toBe("目的を編集");
  });

  it("既存（シード）の届も保存できる", async () => {
    const repo = new MockCtnRepository();
    const db0 = await repo.getState();
    const target = db0.notifications.find((n) => n.status === "draft") ?? db0.notifications[0];

    const saved = await repo.updateNotification({ ...target, remarks: "備考を追記" }, "u-a");
    expect(saved.remarks).toBe("備考を追記");

    const db1 = await repo.getState();
    expect(find(db1, target.id)?.remarks).toBe("備考を追記");
  });

  it("保存で未採番の順序番号が確定する", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);
    const n = await repo.createNotification({ compoundId, notifType: "change", createdBy: "u-a" });

    // 継承した施設・医師のイベント行は serialNo=0 で来る
    const zeroed = n.sites.flatMap((s) => s.investigators).filter((i) => i.serialNo <= 0);
    const saved = await repo.updateNotification(n, "u-a");

    if (zeroed.length > 0) {
      const still = saved.sites.flatMap((s) => s.investigators).filter((i) => i.serialNo <= 0);
      expect(still, "保存後に未採番が残っている").toHaveLength(0);
    }
    for (const s of saved.sites) expect(s.serialNo).toBeGreaterThan(0);
    for (const d of saved.studyDrugs) expect(d.serialNo).toBeGreaterThan(0);
  });

  it("保存が監査ログに残る", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "u-a" });

    const before = (await repo.getState()).audit.length;
    await repo.updateNotification({ ...n, protocolNo: "P-1" }, "u-a");
    const after = await repo.getState();
    expect(after.audit.length).toBe(before + 1);
  });
});

describe("mock: ワークフロー", () => {
  it("レビュー送付 → 承認 → 提出 が通る", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "u-a" });

    await repo.sendForReview(n.id, "u-a");
    expect(find(await repo.getState(), n.id)?.status).toBe("review");

    await repo.approveNotification(n.id, "u-c");
    expect(find(await repo.getState(), n.id)?.status).toBe("approved");

    await repo.submitNotification(n.id, "u-d");
    expect(find(await repo.getState(), n.id)?.status).toBe("submitted");
  });

  it("起票者は自分の届を承認できない（職務分離）", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);
    // 承認者ロール（u-c）が自分で起票した届。ロールは満たすが職務分離で止まる
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "u-c" });
    await expect(repo.approveNotification(n.id, "u-c")).rejects.toThrow(/職務分離/);
  });

  it("承認前は提出できない（提出ゲート）", async () => {
    const repo = new MockCtnRepository();
    const compoundId = await firstCompoundId(repo);
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "u-a" });
    await expect(repo.submitNotification(n.id, "u-d")).rejects.toThrow(/提出ゲート/);
  });
});

describe("mock: 継承（変更届の作成）", () => {
  it("変更届は前届の内容を引き継ぐ", async () => {
    const repo = new MockCtnRepository();
    const db0 = await repo.getState();
    // シードに計画届がある成分を選ぶ
    const plan = db0.notifications.find((n) => n.notifType === "plan" && n.studyDrugs.length > 0);
    expect(plan, "シードに治験使用薬を持つ計画届が必要").toBeDefined();

    const change = await repo.createNotification({
      compoundId: plan!.compoundId,
      notifType: "change",
      createdBy: "u-a",
      targetFilingCount: plan!.filingCount,
    });

    expect(change.filingCount).toBe(plan!.filingCount); // 据え置き
    expect(change.changeCount).toBeGreaterThan(0);
    expect(change.protocolNo).toBe(plan!.protocolNo);
    expect(change.studyDrugs.length).toBe(plan!.studyDrugs.length);
    // 治験使用薬の順序番号は突合キーなので引き継がれる
    expect(change.studyDrugs.map((d) => d.serialNo)).toEqual(plan!.studyDrugs.map((d) => d.serialNo));
  });
});
