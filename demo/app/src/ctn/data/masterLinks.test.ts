// ============================================================================
// マスタの紐づけの検査
// ----------------------------------------------------------------------------
// 届の実施医療機関で選べる医師は「医師マスタの所属医療機関」で決まる
// （クライアント要望 2026-09-05：マスタの紐づけが重要）。
// 画面がその紐づけで選択肢を絞る以上、デモデータもそれに従っていないと
// 「一覧に出ない医師が届に載っている」という説明のつかない状態になる。
// ============================================================================
import { describe, expect, it } from "vitest";
import { makeSeedDb } from "./seed";

const db = makeSeedDb();
const doctorById = new Map(db.doctors.map((d) => [d.id, d]));

describe("医師は所属医療機関に紐づいている", () => {
  it("すべての医師に所属医療機関がある（紐づけの単一ソース）", () => {
    const missing = db.doctors.filter((d) => !d.institutionId).map((d) => d.nameFiling);
    expect(missing).toEqual([]);
  });

  it("所属医療機関が実在する", () => {
    const ids = new Set(db.institutions.map((i) => i.id));
    const bad = db.doctors.filter((d) => d.institutionId && !ids.has(d.institutionId));
    expect(bad.map((d) => `${d.nameFiling}:${d.institutionId}`)).toEqual([]);
  });

  for (const n of db.notifications) {
    for (const site of n.sites) {
      if (!site.institutionId) continue;
      const inst = db.institutions.find((i) => i.id === site.institutionId);
      it(`${n.id} / ${inst?.name ?? site.institutionId}：登録されている医師がその施設の医師である`, () => {
        const bad = site.investigators
          .map((inv) => doctorById.get(inv.doctorId))
          .filter((d) => d && d.institutionId !== site.institutionId)
          .map((d) => `${d!.nameFiling}（所属: ${d!.institutionId}）`);
        expect(bad, "画面ではこの施設の医師として選べないのに届に載っている").toEqual([]);
      });
    }
  }
});

describe("CRC は持たない", () => {
  // 届書に CRC の欄が無いため、画面からもマスタからも落とした（2026-09-05）。
  it("マスタに治験施設支援スタッフのコレクションが無い", () => {
    expect(Object.keys(db)).not.toContain("siteStaff");
  });

  it("実施医療機関に CRC の項目が残っていない", () => {
    const sites = db.notifications.flatMap((n) => n.sites);
    expect(sites.filter((s) => "crcStaffId" in s)).toEqual([]);
  });
});
