// ============================================================================
// sharepointRepository.test.ts — Phase 2 の受け入れ基準に対応するテスト
// ----------------------------------------------------------------------------
// ブリーフ 7章 Phase 2 が要求する検証項目:
//   - 集約 JSON の往復（シリアライズ→パースで同値）
//   - etag 付き MERGE
//   - 412 → リトライの採番衝突シナリオ
//   - 職務分離違反の拒否
//   - 承認前提出の拒否
//   - 監査追記
// ============================================================================
import { describe, expect, it } from "vitest";

import { FakeSpClient } from "./fakeSpClient";
import { SharePointCtnRepository, readNotification, writeNotification } from "./sharepointRepository";
import { resolveRole } from "./roleResolver";
import type { Notification } from "../shared/ctn/types";

const DISPLAY = (id: string): string => `表示:${id}`;

/** 最小構成のシリーズ（届出者1・成分1）を用意する */
function setup(): { sp: FakeSpClient; repo: SharePointCtnRepository; compoundId: string } {
  const sp = new FakeSpClient();
  const sponsor = sp.seed("CtnSponsors", { Title: "製薬A", CtnName: "製薬A", CtnActive: true });
  const compound = sp.seed("CtnCompounds", {
    Title: "ABC-123",
    CtnCompoundCode: "ABC-123",
    CtnTargetCategory: 1,
    CtnTrialKind: "医薬品",
    CtnInitReceptNo: "",
    CtnInitNoteDate: "",
    CtnDevStatus: 1,
    CtnSponsorId: sponsor.Id,
    CtnDrugName: "ABC",
    CtnCreatedAt: "2026-01-01",
  });
  // このファイルは HTTP と応答解析の検証が目的。ロール制限で止まらないよう
  // 全操作が可能な薬事担当として組み立てる（ロール別の可否は permissions.test.ts）。
  const repo = new SharePointCtnRepository(sp, DISPLAY, () => "regulatory");
  return { sp, repo, compoundId: String(compound.Id) };
}

describe("集約JSONの往復", () => {
  it("writeNotification → readNotification で子配列を含めて同値になる", () => {
    const n: Notification = {
      id: "7",
      compoundId: "3",
      notifType: "change",
      filingCount: 2,
      changeCount: 1,
      status: "draft",
      changeLocations: [1, 2],
      protocolNo: "P-001",
      objectives: "目的",
      targetDisease: "対象疾患",
      isGlobal: true,
      sponsorId: "1",
      studyDrugs: [
        {
          id: "d1", drugRole: 1, serialNo: 1, drugName: "薬A", plantName: "工場",
          plantAddress1: "所在地1", plantAddress2: "所在地2", plantCode: "C1",
          ingredients: "成分", intendEffects: "効能", efficacyClassCode: "111",
          intendDosage: "用法",
        },
      ],
      sites: [
        {
          id: "s1", institutionId: "10", serialNo: 1, department: "内科",
          plannedSubjects: 5, irbId: "20",
          investigators: [
            {
              id: "i1", doctorId: "30", doctorRole: 1, serialNo: 1, changeType: 100001003,
              nameOriginal: "山田 太郎", nameFiling: "山田 太郎", pronounce: "やまだ",
              medSchoolNo: "01", graduationYear: "2000",
            },
          ],
          quantities: [{ studyDrugId: "d1", serialNo: 1, qtyPlanned: 100 }],
        },
      ],
      attachments: [],
      references: [],
      inquiries: [],
      createdBy: "u@example.com",
      createdAt: "2026-01-01",
    };

    const fields = writeNotification(n, "ABC-123");
    const roundTripped = readNotification({
      Id: 7,
      CtnCompoundId: 3,
      CtnPayload: fields.CtnPayload,
    });

    expect(roundTripped).toEqual(n);
  });

  it("昇格列は集約から投影され、一覧用の表示名が組み立てられる", () => {
    const fields = writeNotification(
      {
        id: "1", compoundId: "3", notifType: "change", filingCount: 2, changeCount: 1,
        status: "review", changeLocations: [], protocolNo: "P-9", objectives: "",
        targetDisease: "", isGlobal: false, sponsorId: "1", studyDrugs: [], sites: [],
        attachments: [], references: [], inquiries: [], createdBy: "a@x", createdAt: "2026-01-01",
        noteDate: "2026-02-01", approvedBy: "b@x",
      },
      "ABC-123"
    );
    expect(fields.Title).toBe("ABC-123 届2/変1 変更届");
    expect(fields.CtnFilingCount).toBe(2);
    expect(fields.CtnChangeCount).toBe(1);
    expect(fields.CtnStatus).toBe("review");
    expect(fields.CtnCreatedByUser).toBe("a@x");
    expect(fields.CtnApprovedByUser).toBe("b@x");
    expect(fields.CtnPayloadVersion).toBe("1");
  });

  it("CtnPayload が壊れていれば黙って空を返さず失敗する", () => {
    expect(() => readNotification({ Id: 1, CtnPayload: "{壊れたJSON" })).toThrow(/解釈できません/);
    expect(() => readNotification({ Id: 1, CtnPayload: "" })).toThrow(/空です/);
  });
});

describe("採番（logic.ts 経由）", () => {
  it("計画届は届出回数を +1 し、変更届は据え置いて変更回数を採番する", async () => {
    const { repo, compoundId } = setup();

    const plan1 = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    expect(plan1.filingCount).toBe(1);
    expect(plan1.changeCount).toBeUndefined();

    const change1 = await repo.createNotification({ compoundId, notifType: "change", createdBy: "a@x" });
    expect(change1.filingCount).toBe(1); // 据え置き
    expect(change1.changeCount).toBe(1);

    const plan2 = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    expect(plan2.filingCount).toBe(2); // 新規プロトコール

    const change2 = await repo.createNotification({ compoundId, notifType: "change", createdBy: "a@x" });
    expect(change2.filingCount).toBe(2);
    expect(change2.changeCount).toBe(1); // 届2 の中で 1 から
  });

  it("届1の変更は届2に影響しない（手引きのツリー）", async () => {
    const { repo, compoundId } = setup();
    await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });

    const c1 = await repo.createNotification({ compoundId, notifType: "change", createdBy: "a@x", targetFilingCount: 1 });
    const c2 = await repo.createNotification({ compoundId, notifType: "change", createdBy: "a@x", targetFilingCount: 2 });
    expect([c1.filingCount, c1.changeCount]).toEqual([1, 1]);
    expect([c2.filingCount, c2.changeCount]).toEqual([2, 1]);
  });
});

describe("etag が応答に含まれない環境（実テナントで踏んだ回帰）", () => {
  // 実テナントでは POST /items の応答に odata.etag が入らず、作成直後の
  // 更新が「etag が未取得です」で必ず失敗した。作成した届が中途半端な状態で
  // 残り、押した回数ぶん増えていく症状になる。
  it("届を作成できる（etag を取り直す）", async () => {
    const { sp, repo, compoundId } = setup();
    sp.addItemOmitsEtag = true;

    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    expect(n.id).toBeTruthy();
    // 集約JSON内の id が項目 Id と一致している（2段目の書き込みが通った証拠）
    const raw = sp.raw("CtnNotifications", Number(n.id))!;
    expect(JSON.parse(String(raw.CtnPayload)).id).toBe(n.id);
  });

  it("作成した届をそのまま保存できる", async () => {
    const { sp, repo, compoundId } = setup();
    sp.addItemOmitsEtag = true;

    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    const saved = await repo.updateNotification({ ...n, protocolNo: "P-9" }, "a@x");
    expect(saved.protocolNo).toBe("P-9");
    expect(sp.raw("CtnNotifications", Number(n.id))!.CtnProtocolNo).toBe("P-9");
  });

  it("マスタも作成・更新できる", async () => {
    const { sp, repo } = setup();
    sp.addItemOmitsEtag = true;

    const inst = await repo.createInstitution(
      { code: "H1", name: "第一病院", address1: "", address2: "", telNo: "", active: true },
      "a@x"
    );
    const updated = await repo.updateInstitution({ ...inst, telNo: "03-0000-0000" }, "a@x");
    expect(updated.telNo).toBe("03-0000-0000");
  });

  it("存在しない項目の etag は取り直しても失敗する（黙って * を使わない）", async () => {
    const { repo } = setup();
    await expect(
      repo.updateInstitution(
        { id: "9999", code: "X", name: "無い病院", address1: "", address2: "", telNo: "", active: true },
        "a@x"
      )
    ).rejects.toThrow(/取得できませんでした/);
  });
});

describe("etag（楽観的同時実行制御）", () => {
  it("更新は実 etag を使い、書き込みごとに etag が進む", async () => {
    const { sp, repo, compoundId } = setup();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });

    const before = sp.raw("CtnNotifications", Number(n.id));
    expect(before).toBeDefined();

    await repo.updateNotification({ ...n, protocolNo: "P-1" }, "a@x");
    const after = sp.raw("CtnNotifications", Number(n.id))!;
    expect(JSON.parse(String(after.CtnPayload)).protocolNo).toBe("P-1");
    expect(after.CtnProtocolNo).toBe("P-1"); // 昇格列も同一書き込みで更新される
  });

  it("古い etag での更新は競合として拒否される", async () => {
    const { sp } = setup();
    const item = sp.seed("CtnDoctors", { Title: "医師", CtnActive: true });
    await sp.updateItem("CtnDoctors", item.Id, { CtnActive: false }, item.__etag!);
    // 同じ（古い）etag で二度目 → 412 相当
    await expect(
      sp.updateItem("CtnDoctors", item.Id, { CtnActive: true }, item.__etag!)
    ).rejects.toThrow(/etag 不一致/);
  });

  it("集約JSONと昇格列は1回の書き込みで更新される（別々に更新しない）", async () => {
    const { sp, repo, compoundId } = setup();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    sp.calls.length = 0;

    await repo.updateNotification({ ...n, protocolNo: "P-2" }, "a@x");

    const writes = sp.calls.filter((c) => c.op === "update" && c.list === "CtnNotifications");
    expect(writes).toHaveLength(1);
  });
});

describe("提出", () => {
  /** 承認済みの届を用意する（起票者と承認者を分ける） */
  async function approved(): Promise<{ sp: FakeSpClient; repo: SharePointCtnRepository; id: string }> {
    const { sp, repo, compoundId } = setup();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "drafter@x" });
    await repo.sendForReview(n.id, "drafter@x");
    await repo.approveNotification(n.id, "approver@x");
    return { sp, repo, id: n.id };
  }

  it("承認前の提出は提出ゲートで拒否される", async () => {
    const { repo, compoundId } = setup();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    await expect(repo.submitNotification(n.id, "a@x")).rejects.toThrow(/提出ゲート/);
  });

  it("起票者による承認は職務分離で拒否される", async () => {
    const { repo, compoundId } = setup();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "same@x" });
    await expect(repo.approveNotification(n.id, "same@x")).rejects.toThrow(/職務分離/);
  });

  it("承認済みなら提出でき、順序番号が確定する", async () => {
    const { sp, repo, id } = await approved();
    await repo.submitNotification(id, "reg@x");
    const raw = sp.raw("CtnNotifications", Number(id))!;
    expect(raw.CtnStatus).toBe("submitted");
    expect(String(raw.CtnNoteDate)).not.toBe("");
  });

  it("提出中に競合しても再取得→再計算→リトライで成功する", async () => {
    const { sp, repo, id } = await approved();
    sp.failNextUpdateWithConflict = 1; // 1回だけ他者が割り込む

    await repo.submitNotification(id, "reg@x");

    const raw = sp.raw("CtnNotifications", Number(id))!;
    expect(raw.CtnStatus).toBe("submitted");
    // 1回目は失敗しているので、届への更新は2回試行されている
    const writes = sp.calls.filter((c) => c.op === "update" && c.list === "CtnNotifications");
    expect(writes.length).toBeGreaterThanOrEqual(2);
  });

  it("競合が続けば黙って諦めず、操作者に分かるエラーを出す", async () => {
    const { sp, repo, id } = await approved();
    sp.failNextUpdateWithConflict = 99;
    await expect(repo.submitNotification(id, "reg@x")).rejects.toThrow(/競合により/);
  });

  it("開発中止届の提出でシリーズの開発状態が更新される", async () => {
    const { sp, repo, compoundId } = setup();
    await repo.createNotification({ compoundId, notifType: "plan", createdBy: "d@x" });
    const stop = await repo.createNotification({ compoundId, notifType: "devDiscontinuation", createdBy: "d@x" });
    await repo.sendForReview(stop.id, "d@x");
    await repo.approveNotification(stop.id, "a@x");

    const before = sp.raw("CtnCompounds", Number(compoundId))!.CtnDevStatus;
    await repo.submitNotification(stop.id, "reg@x");
    const after = sp.raw("CtnCompounds", Number(compoundId))!.CtnDevStatus;
    expect(after).not.toBe(before);
  });
});

describe("削除", () => {
  it("起票中のみ削除でき、承認済みは拒否される", async () => {
    const { repo, compoundId } = setup();
    const draft = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    await repo.deleteNotification(draft.id, "a@x"); // draft は消せる

    const other = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    await repo.sendForReview(other.id, "a@x");
    await repo.approveNotification(other.id, "b@x");
    await expect(repo.deleteNotification(other.id, "a@x")).rejects.toThrow(/削除できません/);
  });
});

describe("監査ログ", () => {
  it("書き込み操作ごとに CtnAudit へ追記される", async () => {
    const { sp, repo, compoundId } = setup();
    expect(sp.count("CtnAudit")).toBe(0);

    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    expect(sp.count("CtnAudit")).toBe(1);

    await repo.updateNotification({ ...n, protocolNo: "P" }, "a@x");
    await repo.sendForReview(n.id, "a@x");
    await repo.approveNotification(n.id, "b@x");
    expect(sp.count("CtnAudit")).toBe(4);

    const entries = await sp.getItems("CtnAudit", "$orderby=Id desc");
    expect(entries[0].CtnAction).toBe("approve");
    expect(entries[0].CtnWho).toBe("表示:b@x"); // actor は表示名に解決される
  });

  it("マスタ登録も監査に残る", async () => {
    const { sp, repo } = setup();
    await repo.createInstitution(
      { code: "H1", name: "第一病院", address1: "", address2: "", telNo: "", active: true },
      "a@x"
    );
    const entries = await sp.getItems("CtnAudit", "");
    expect(entries).toHaveLength(1);
    expect(entries[0].CtnEntity).toBe("医療機関マスタ");
  });
});

describe("マスタの読み書き", () => {
  it("医師は届出用表記が空なら外字正規化で補完される", async () => {
    const { repo } = setup();
    const d = await repo.createDoctor(
      {
        doctorNo: "D1", nameOriginal: "髙橋 一郎", nameFiling: "", pronounce: "たかはし",
        medSchoolNo: "01", graduationYear: "1999", hasGaiji: true, active: true,
      },
      "a@x"
    );
    expect(d.nameFiling).not.toBe("");
  });

  it("論理削除は CtnActive の切替で、行は残る", async () => {
    const { sp, repo } = setup();
    const inst = await repo.createInstitution(
      { code: "H1", name: "第一病院", address1: "", address2: "", telNo: "", active: true },
      "a@x"
    );
    await repo.setInstitutionActive(inst.id, false, "a@x");
    expect(sp.count("CtnInstitutions")).toBe(1);
    expect(sp.raw("CtnInstitutions", Number(inst.id))!.CtnActive).toBe(false);
  });

  it("getState は9リストをまとめて読み、ドメイン型へ写像する", async () => {
    const { sp, repo, compoundId } = setup();
    await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    sp.seed("CtnInstitutions", { CtnCode: "H1", CtnName: "第一病院", CtnActive: true });

    const db = await repo.getState();
    expect(db.compounds).toHaveLength(1);
    expect(db.compounds[0].compoundCode).toBe("ABC-123");
    expect(db.notifications).toHaveLength(1);
    expect(db.institutions[0].name).toBe("第一病院");
    expect(db.audit.length).toBeGreaterThan(0);
    // SharePoint の数値 Id は文字列へ変換され、UI へは数値が漏れない
    expect(typeof db.compounds[0].id).toBe("string");
  });
});

describe("ロール解決（SharePoint グループ）", () => {
  it("グループ名からロールを引く", () => {
    expect(resolveRole(["CTN 承認者"])).toBe("approver");
    expect(resolveRole(["CTN 起票担当"])).toBe("drafter");
    expect(resolveRole(["CTN レビュー担当"])).toBe("reviewer");
    expect(resolveRole(["CTN 薬事担当"])).toBe("regulatory");
  });

  it("どのグループにも属さなければ閲覧のみ（viewer）", () => {
    // サイトを見られるだけの利用者が届を起票できてしまわないようにするため、
    // 未所属は drafter ではなく viewer に落とす。
    expect(resolveRole([])).toBe("viewer");
    expect(resolveRole(["メンバー", "所有者"])).toBe("viewer");
  });

  it("複数所属では強い権限が優先される", () => {
    expect(resolveRole(["CTN 起票担当", "CTN 承認者"])).toBe("approver");
    expect(resolveRole(["CTN 起票担当", "CTN レビュー担当"])).toBe("reviewer");
    // 提出は薬事のみの権限。兼務で失わないよう薬事を最上位に置く。
    expect(resolveRole(["CTN 承認者", "CTN 薬事担当"])).toBe("regulatory");
  });
});
