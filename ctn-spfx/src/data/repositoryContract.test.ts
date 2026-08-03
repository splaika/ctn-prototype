// ============================================================================
// repositoryContract.test.ts — CtnRepository の全メソッドを両実装に流す契約テスト
// ----------------------------------------------------------------------------
// 目的: SharePoint 実装だけが踏む不具合を、デプロイ前に洗い出す。
//
// これまで実テナントで2度詰まった（作成応答の etag 欠落、失敗の黙殺）。いずれも
// 「mock では起きず SharePoint では起きる」類で、片方だけのテストでは見つからない。
// そこで同じシナリオを両実装に流し、結果が一致することを確認する。
//
// SharePoint 側は最も厳しい条件で走らせる:
//   - 追加（POST）の応答に etag が含まれない
//   - 一覧取得（$select 付き GET）の応答にも etag が含まれない
// この2つが実テナントで起きうる最悪の組み合わせ。
// ============================================================================
import { describe, expect, it } from "vitest";

import { FakeSpClient } from "./fakeSpClient";
import { MockCtnRepository } from "../shared/ctn/data/mockRepository";
import { SharePointCtnRepository } from "./sharepointRepository";
import type { CtnDb, CtnRepository } from "../shared/ctn/data/repository";
import type { Notification } from "../shared/ctn/types";

/** 実装ごとの「まっさらな状態＋最低限のマスタ」を用意する */
interface Harness {
  repo: CtnRepository;
  compoundId: string;
  /** 各ロールの操作者（実装によって id の形が違うので抽象化する） */
  drafter: string;
  reviewer: string;
  approver: string;
  regulatory: string;
}

async function mockHarness(): Promise<Harness> {
  const repo = new MockCtnRepository();
  const db = await repo.getState();
  // mock はデモ利用者表からロールを引く: u-a 起票 / u-b レビュー / u-c 承認 / u-d 薬事
  return { repo, compoundId: db.compounds[0].id, drafter: "u-a", reviewer: "u-b", approver: "u-c", regulatory: "u-d" };
}

async function spHarness(mode: "normal" | "hostile" | "noBodyEtag"): Promise<Harness & { sp: FakeSpClient }> {
  const sp = new FakeSpClient();
  sp.addItemOmitsEtag = mode !== "normal";
  sp.getItemsOmitsEtagWhenSelecting = mode !== "normal";
  // 実テナントで実際に起きた条件: 応答本文に etag が一切入らない
  // （ETag レスポンスヘッダー経由でしか取れない）
  sp.bodyNeverHasEtag = mode === "noBodyEtag";

  // 契約テストは書き込み経路の検証が目的。ロール制限で止まらないよう全操作が
  // 可能な薬事担当として組み立てる（ロール別の可否は permissions.test.ts）。
  const repo = new SharePointCtnRepository(sp, (id) => `表示:${id}`, () => "regulatory");
  const sponsor = await repo.createSponsor(
    {
      sponsorType: "製造販売業者", name: "製薬A", repName: "代表", address1: "東京", address2: "",
      manufacturerCode: "C1", contactName: "担当", contactTitle: "部長", telNo: "03",
      faxOrMail: "a@x", active: true,
    },
    "seed"
  );
  const compound = await repo.createCompound(
    {
      compoundCode: "ABC-123", targetCategory: 1, trialKind: "医薬品", initReceptNo: "",
      initNoteDate: "", devStatus: 1, sponsorId: sponsor.id, drugName: "ABC",
    },
    "seed"
  );
  // SharePoint 実装のロールはサインインユーザー単位（上で regulatory 固定）。
  // ロール別の可否は permissions.test.ts が担い、ここでは書き込み経路を見る。
  return {
    repo, sp, compoundId: compound.id,
    drafter: "drafter@x", reviewer: "reviewer@x", approver: "approver@x", regulatory: "regulatory@x",
  };
}

const find = (db: CtnDb, id: string): Notification | undefined =>
  db.notifications.find((n) => n.id === id);

/** 両実装に同じシナリオを流す */
const IMPLS: { name: string; make: () => Promise<Harness> }[] = [
  { name: "mock", make: mockHarness },
  { name: "SharePoint（通常）", make: () => spHarness("normal") },
  { name: "SharePoint（$select で etag が落ちる）", make: () => spHarness("hostile") },
  // 実テナントで実際に踏んだ条件。本文に etag が一切入らず、
  // ETag レスポンスヘッダー経由でしか取得できない
  { name: "SharePoint（本文に etag が無い＝実環境）", make: () => spHarness("noBodyEtag") },
];

for (const impl of IMPLS) {
  describe(`契約: ${impl.name}`, () => {
    it("届を作成して保存できる", async () => {
      const { repo, compoundId, drafter } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      expect(n.id).toBeTruthy();
      expect(n.filingCount).toBeGreaterThan(0);

      const saved = await repo.updateNotification({ ...n, protocolNo: "P-1", objectives: "目的" }, drafter);
      expect(saved.protocolNo).toBe("P-1");

      const db = await repo.getState();
      expect(find(db, n.id)?.protocolNo).toBe("P-1");
      expect(find(db, n.id)?.objectives).toBe("目的");
    });

    it("同じ届を続けて何度も保存できる（etag の更新が追随する）", async () => {
      const { repo, compoundId, drafter } = await impl.make();
      let n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      for (let i = 1; i <= 4; i++) {
        n = await repo.updateNotification({ ...n, protocolNo: `P-${i}` }, drafter);
        expect(n.protocolNo).toBe(`P-${i}`);
      }
      const db = await repo.getState();
      expect(find(db, n.id)?.protocolNo).toBe("P-4");
    });

    it("レビュー送付 → 承認 → 提出 が通る", async () => {
      const { repo, compoundId, drafter, approver, regulatory } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });

      await repo.sendForReview(n.id, drafter);
      expect(find(await repo.getState(), n.id)?.status).toBe("review");
      await repo.approveNotification(n.id, approver);
      expect(find(await repo.getState(), n.id)?.status).toBe("approved");
      await repo.submitNotification(n.id, regulatory); // 提出は薬事のみ

      const done = find(await repo.getState(), n.id);
      expect(done?.status).toBe("submitted");
      expect(done?.submittedAt).toBeTruthy();
      expect(done?.noteDate).toBeTruthy();
    });

    it("起票者は自分の届を承認できない", async () => {
      // ロールを満たしていても職務分離で止まることを見る。承認者自身が起票する。
      const { repo, compoundId, approver } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: approver });
      await expect(repo.approveNotification(n.id, approver)).rejects.toThrow(/職務分離/);
    });

    it("承認前は提出できない", async () => {
      const { repo, compoundId, drafter, regulatory } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await expect(repo.submitNotification(n.id, regulatory)).rejects.toThrow(/提出ゲート/);
    });

    it("差し戻すと作成中へ戻り、理由が残る。再送付で消える", async () => {
      const { repo, compoundId, drafter, reviewer } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await repo.sendForReview(n.id, drafter);

      await repo.rejectNotification(n.id, reviewer, "実施計画書識別記号が未入力");
      const back = find(await repo.getState(), n.id);
      expect(back?.status).toBe("draft");
      expect(back?.rejectionReason).toBe("実施計画書識別記号が未入力");
      expect(back?.rejectedBy).toBe(reviewer);

      await repo.sendForReview(n.id, drafter);
      const resent = find(await repo.getState(), n.id);
      expect(resent?.status).toBe("review");
      expect(resent?.rejectionReason).toBeUndefined();
    });

    it("レビュー中以外は差し戻せない", async () => {
      const { repo, compoundId, drafter, reviewer } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await expect(repo.rejectNotification(n.id, reviewer, "要修正")).rejects.toThrow(/レビュー中/);
    });

    it("起票中の届は削除でき、承認済みは削除できない", async () => {
      const { repo, compoundId, drafter, approver } = await impl.make();
      const draft = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await repo.deleteNotification(draft.id, drafter);
      expect(find(await repo.getState(), draft.id)).toBeUndefined();

      const other = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await repo.sendForReview(other.id, drafter);
      await repo.approveNotification(other.id, approver);
      await expect(repo.deleteNotification(other.id, drafter)).rejects.toThrow(/削除できません/);
    });

    it("XML生成の記録ができる", async () => {
      const { repo, compoundId, drafter } = await impl.make();
      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await repo.markXmlGenerated(n.id, drafter);
      expect(find(await repo.getState(), n.id)?.xmlGeneratedAt).toBeTruthy();
    });

    it("変更届は届出回数を据え置き、変更回数を採番する", async () => {
      const { repo, compoundId, drafter } = await impl.make();
      const plan = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      const change = await repo.createNotification({
        compoundId, notifType: "change", createdBy: drafter, targetFilingCount: plan.filingCount,
      });
      expect(change.filingCount).toBe(plan.filingCount);
      expect(change.changeCount).toBe(1);

      const change2 = await repo.createNotification({
        compoundId, notifType: "change", createdBy: drafter, targetFilingCount: plan.filingCount,
      });
      expect(change2.changeCount).toBe(2);
    });

    it("マスタ5種を登録・更新・論理削除・復活できる", async () => {
      const { repo, drafter } = await impl.make();

      const inst = await repo.createInstitution(
        { code: "H9", name: "第九病院", address1: "東京", address2: "", telNo: "03", active: true },
        drafter
      );
      expect((await repo.updateInstitution({ ...inst, telNo: "06" }, drafter)).telNo).toBe("06");
      await repo.setInstitutionActive(inst.id, false, drafter);
      expect((await repo.getState()).institutions.find((x) => x.id === inst.id)?.active).toBe(false);
      await repo.setInstitutionActive(inst.id, true, drafter);
      expect((await repo.getState()).institutions.find((x) => x.id === inst.id)?.active).toBe(true);

      const doc = await repo.createDoctor(
        {
          doctorNo: "D9", nameOriginal: "山田 太郎", nameFiling: "山田 太郎", pronounce: "やまだ",
          medSchoolNo: "01", graduationYear: "2000", hasGaiji: false, active: true,
        },
        drafter
      );
      expect((await repo.updateDoctor({ ...doc, pronounce: "ヤマダ" }, drafter)).pronounce).toBe("ヤマダ");
      await repo.setDoctorActive(doc.id, false, drafter);

      const irb = await repo.createIrb(
        { irbType: 1, ownerName: "第九IRB", address1: "", address2: "", active: true },
        drafter
      );
      expect((await repo.updateIrb({ ...irb, ownerName: "第九IRB改" }, drafter)).ownerName).toBe("第九IRB改");
      await repo.setIrbActive(irb.id, false, drafter);

      const sp2 = await repo.createSponsor(
        {
          sponsorType: "製造販売業者", name: "製薬B", repName: "代表", address1: "", address2: "",
          manufacturerCode: "C2", contactName: "担当", contactTitle: "課長", telNo: "03",
          faxOrMail: "b@x", active: true,
        },
        drafter
      );
      expect((await repo.updateSponsor({ ...sp2, telNo: "04" }, drafter)).telNo).toBe("04");
      await repo.setSponsorActive(sp2.id, false, drafter);

      const staff = await repo.createSiteStaff(
        { name: "鈴木", kana: "スズキ", role: "CRC", institutionId: inst.id, telNo: "03", mail: "s@x", active: true },
        drafter
      );
      expect((await repo.updateSiteStaff({ ...staff, mail: "t@x" }, drafter)).mail).toBe("t@x");
      await repo.setSiteStaffActive(staff.id, false, drafter);
    });

    it("外字確認履歴を追記すると医師の外字フラグが立つ", async () => {
      const { repo, drafter } = await impl.make();
      const doc = await repo.createDoctor(
        {
          doctorNo: "D8", nameOriginal: "髙橋 一郎", nameFiling: "高橋 一郎", pronounce: "たかはし",
          medSchoolNo: "02", graduationYear: "1999", hasGaiji: false, active: true,
        },
        drafter
      );
      await repo.addGaijiRecord({
        doctorId: doc.id, targetColumn: "nameOriginal", originalChar: "髙", codePoint: "U+9AD9",
        replacementChar: "高", gaijiType: 1, confirmedBy: drafter, confirmedOn: "2026-07-29",
      });
      const db = await repo.getState();
      expect(db.gaiji.some((g) => g.doctorId === doc.id)).toBe(true);
      expect(db.doctors.find((d) => d.id === doc.id)?.hasGaiji).toBe(true);
    });

    it("書き込みが監査ログに残る", async () => {
      const { repo, compoundId, drafter, approver } = await impl.make();
      const before = (await repo.getState()).audit.length;

      const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: drafter });
      await repo.updateNotification({ ...n, protocolNo: "P" }, drafter);
      await repo.sendForReview(n.id, drafter);
      await repo.approveNotification(n.id, approver);

      const after = (await repo.getState()).audit.length;
      expect(after).toBe(before + 4);
    });

    it("255文字を超える自由入力でも保存できる", async () => {
      const { repo, drafter } = await impl.make();
      const longName = "あ".repeat(400);
      const inst = await repo.createInstitution(
        { code: "H7", name: longName, address1: longName, address2: "", telNo: "03", active: true },
        drafter
      );
      expect(inst.id).toBeTruthy();
      // 1行テキスト列は上限で丸められるが、書き込み自体は失敗しない
      const stored = (await repo.getState()).institutions.find((x) => x.id === inst.id);
      expect(stored).toBeDefined();
      expect(stored!.name.length).toBeGreaterThan(0);
    });

    it("存在しない届の操作は明確に失敗する", async () => {
      const { repo, drafter } = await impl.make();
      await expect(repo.sendForReview("999999", drafter)).rejects.toThrow();
      await expect(repo.deleteNotification("999999", drafter)).rejects.toThrow();
      await expect(repo.markXmlGenerated("999999", drafter)).rejects.toThrow();
    });
  });
}

describe("SharePoint 固有: 往復数の削減が正しさを崩していないか", () => {
  /** 最小構成を作る（往復数を数えるため呼び出し記録をリセットできる形で） */
  async function ready(): Promise<{ sp: FakeSpClient; repo: SharePointCtnRepository; compoundId: string }> {
    const h = await spHarness("noBodyEtag");
    return { sp: h.sp, repo: h.repo as SharePointCtnRepository, compoundId: h.compoundId };
  }

  it("採番が必要な保存では、シリーズを取得して順序番号を確定する", async () => {
    const { sp, repo, compoundId } = await ready();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });

    // 未採番の治験使用薬を1件足す
    const withDrug = {
      ...n,
      studyDrugs: [
        {
          id: "d1", drugRole: 1, serialNo: 0, drugName: "薬A", plantName: "", plantAddress1: "",
          plantAddress2: "", plantCode: "", ingredients: "", intendEffects: "",
          efficacyClassCode: "", intendDosage: "",
        },
      ],
    };
    const saved = await repo.updateNotification(withDrug, "a@x");
    expect(saved.studyDrugs[0].serialNo).toBeGreaterThan(0); // 確定している
  });

  it("すべて採番済みの保存では、シリーズを取得しない（往復を省く）", async () => {
    const { sp, repo, compoundId } = await ready();
    let n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });
    n = await repo.updateNotification(
      {
        ...n,
        studyDrugs: [
          {
            id: "d1", drugRole: 1, serialNo: 0, drugName: "薬A", plantName: "", plantAddress1: "",
            plantAddress2: "", plantCode: "", ingredients: "", intendEffects: "",
            efficacyClassCode: "", intendDosage: "",
          },
        ],
      },
      "a@x"
    );
    expect(n.studyDrugs[0].serialNo).toBeGreaterThan(0);

    // ここから2回目の保存。採番は済んでいるのでシリーズ取得は不要
    sp.calls.length = 0;
    await repo.updateNotification({ ...n, protocolNo: "P-2" }, "a@x");

    const seriesQueries = sp.calls.filter(
      (c) => c.op === "get" && c.list === "CtnNotifications"
    );
    expect(seriesQueries, "採番済みならシリーズを取り直さない").toHaveLength(0);
  });

  it("連続保存で etag の取り直しが起きない（更新応答から引き継ぐ）", async () => {
    const sp = new FakeSpClient(); // 応答が etag を返す通常環境
    const repo = new SharePointCtnRepository(sp, (id) => id, () => "regulatory");
    const sponsor = await repo.createSponsor(
      {
        sponsorType: "x", name: "製薬A", repName: "", address1: "", address2: "",
        manufacturerCode: "", contactName: "", contactTitle: "", telNo: "", faxOrMail: "", active: true,
      },
      "seed"
    );
    const compound = await repo.createCompound(
      {
        compoundCode: "ABC-123", targetCategory: 1, trialKind: "医薬品", initReceptNo: "",
        initNoteDate: "", devStatus: 1, sponsorId: sponsor.id, drugName: "ABC",
      },
      "seed"
    );
    let n = await repo.createNotification({
      compoundId: compound.id, notifType: "plan", createdBy: "a@x",
    });

    sp.calls.length = 0;
    for (let i = 0; i < 3; i++) n = await repo.updateNotification({ ...n, protocolNo: `P-${i}` }, "a@x");

    expect(sp.calls.filter((c) => c.op === "getItemEtag")).toHaveLength(0);
  });

  it("治験成分記号は一度引いたら再取得しない", async () => {
    const { sp, repo, compoundId } = await ready();
    const n = await repo.createNotification({ compoundId, notifType: "plan", createdBy: "a@x" });

    sp.calls.length = 0;
    await repo.updateNotification({ ...n, protocolNo: "A" }, "a@x");
    await repo.updateNotification({ ...n, protocolNo: "B" }, "a@x");

    expect(sp.calls.filter((c) => c.op === "get" && c.list === "CtnCompounds")).toHaveLength(0);
  });
});

describe("SharePoint 固有: 失敗時に中途半端な届を残さない", () => {
  it("2段目の書き込みが失敗したら追加分を取り消す", async () => {
    const sp = new FakeSpClient();
    const repo = new SharePointCtnRepository(sp, (id) => id, () => "regulatory");
    const sponsor = await repo.createSponsor(
      {
        sponsorType: "x", name: "製薬A", repName: "", address1: "", address2: "",
        manufacturerCode: "", contactName: "", contactTitle: "", telNo: "", faxOrMail: "", active: true,
      },
      "seed"
    );
    const compound = await repo.createCompound(
      {
        compoundCode: "ABC-123", targetCategory: 1, trialKind: "医薬品", initReceptNo: "",
        initNoteDate: "", devStatus: 1, sponsorId: sponsor.id, drugName: "ABC",
      },
      "seed"
    );

    // 届の2段目（MERGE）だけを失敗させる
    sp.failUpdatesOnList = "CtnNotifications";
    await expect(
      repo.createNotification({ compoundId: compound.id, notifType: "plan", createdBy: "a@x" })
    ).rejects.toThrow();

    // 追加された届が残っていないこと（実テナントでは 8 件のゴミが残った）
    expect(sp.count("CtnNotifications")).toBe(0);
  });
});

describe("SharePoint 固有: 壊れたデータで全体が死なない", () => {
  it("読めない Payload の届は飛ばして残りを返す", async () => {
    const sp = new FakeSpClient();
    const repo = new SharePointCtnRepository(sp, (id) => id, () => "regulatory");
    sp.seed("CtnNotifications", { Title: "壊れた届", CtnPayload: "{壊れたJSON", CtnCompoundId: 1 });
    sp.seed("CtnNotifications", { Title: "空の届", CtnPayload: "", CtnCompoundId: 1 });

    const db = await repo.getState();
    expect(db.notifications).toHaveLength(0); // 例外にならず空で返る
  });
});
