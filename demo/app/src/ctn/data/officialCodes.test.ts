// ============================================================================
// コード表（手引きからの転記）の検査
// ----------------------------------------------------------------------------
// officialCodes.ts は公式資料を手で書き写したもの（機械可読な配布物が無い）。
// 転記なので「写し間違い」だけが間違え方になる。件数・桁数・重複・分類の
// 使われ方をここで固定して、直したときに崩れたら落とす。
//
// 出典は officialCodes.ts のヘッダに書いてある（治験届の手引き p.37-38）。
// ============================================================================
import { describe, expect, it } from "vitest";
import {
  ADMIN_ROUTE_CODES,
  DOSAGE_FORM_CODES,
  DOSAGE_FORM_GROUPS,
  OFFICIAL_CODES,
  THERAPEUTIC_CLASS_CODES,
  THERAPEUTIC_CLASS_GROUPS,
} from "./officialCodes";
import { CODES, makeSeedDb } from "./seed";

describe("剤形コード", () => {
  it("手引きの表と同じ件数（42件）", () => {
    expect(DOSAGE_FORM_CODES).toHaveLength(42);
  });

  it("すべて2桁の英数字（手引き：2桁）", () => {
    const bad = DOSAGE_FORM_CODES.filter((c) => !/^[A-Z][0-9A-Z]$/.test(c.code));
    expect(bad.map((c) => c.code)).toEqual([]);
  });

  it("コードが重複しない", () => {
    const codes = DOSAGE_FORM_CODES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("分類は手引きの表の見出しのいずれか", () => {
    const allowed = new Set<string>(DOSAGE_FORM_GROUPS);
    const bad = DOSAGE_FORM_CODES.filter((c) => !c.group || !allowed.has(c.group));
    expect(bad.map((c) => `${c.code}:${c.group}`)).toEqual([]);
  });

  it("11の分類すべてに項目がある（表の一部を写し落としていない）", () => {
    const used = new Set(DOSAGE_FORM_CODES.map((c) => c.group));
    expect([...DOSAGE_FORM_GROUPS].filter((g) => !used.has(g))).toEqual([]);
  });

  it("各分類に「その他」（末尾Z）が1件ある", () => {
    // 手引きの表はどの分類も「その他の◯◯」で終わり、コードの2桁目が Z。
    // 写し落としの検出に効く。
    for (const g of DOSAGE_FORM_GROUPS) {
      const z = DOSAGE_FORM_CODES.filter((c) => c.group === g && c.code.endsWith("Z"));
      expect(z, `${g} の「その他」が1件でない`).toHaveLength(1);
      expect(z[0].name).toContain("その他");
    }
  });

  it("分類の並びが表の順（先頭のコード文字が A→K）", () => {
    const firstLetters = DOSAGE_FORM_GROUPS.map(
      (g) => DOSAGE_FORM_CODES.find((c) => c.group === g)!.code[0]
    );
    expect(firstLetters).toEqual([...firstLetters].sort());
  });
});

describe("投与経路コード", () => {
  it("手引きの表と同じ件数（22件）", () => {
    expect(ADMIN_ROUTE_CODES).toHaveLength(22);
  });

  it("すべて2桁の半角数字（手引き：投与経路コード情報（2桁）は半角数字）", () => {
    const bad = ADMIN_ROUTE_CODES.filter((c) => !/^[0-9]{2}$/.test(c.code));
    expect(bad.map((c) => c.code)).toEqual([]);
  });

  it("コードが重複せず、表の順（昇順）に並ぶ", () => {
    const codes = ADMIN_ROUTE_CODES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual([...codes].sort());
  });

  it("分類は持たない（手引きの表に見出しが無い）", () => {
    expect(ADMIN_ROUTE_CODES.filter((c) => c.group)).toEqual([]);
  });
});

describe("コード表全体", () => {
  it("id が重複しない（マスタの主キーになる）", () => {
    const ids = OFFICIAL_CODES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("すべて有効（停止は運用で行う）", () => {
    expect(OFFICIAL_CODES.filter((c) => !c.active)).toEqual([]);
  });

  it("薬効分類番号は手引きの表と同じ件数（179件）", () => {
    expect(THERAPEUTIC_CLASS_CODES).toHaveLength(179);
  });

  it("薬効分類番号はすべて3桁の半角数字（手引き 5.2(10)：3桁）", () => {
    const bad = THERAPEUTIC_CLASS_CODES.filter((c) => !/^[0-9]{3}$/.test(c.code));
    expect(bad.map((c) => c.code)).toEqual([]);
  });

  it("薬効分類番号のコードが重複せず、表の順（昇順）に並ぶ", () => {
    const codes = THERAPEUTIC_CLASS_CODES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual([...codes].sort());
  });

  it("薬効分類番号の大分類が36件すべて使われている", () => {
    const used = new Set(THERAPEUTIC_CLASS_CODES.map((c) => c.group));
    expect(THERAPEUTIC_CLASS_GROUPS).toHaveLength(36);
    expect([...THERAPEUTIC_CLASS_GROUPS].filter((g) => !used.has(g))).toEqual([]);
  });

  it("デモデータのマスタが公式コード表そのものである", () => {
    // 以前は観測できた5件だけを置いていて、届の入力がほぼ手打ちだった
    expect(CODES).toBe(OFFICIAL_CODES);
    expect(makeSeedDb().codes).toHaveLength(OFFICIAL_CODES.length);
  });
});

describe("デモデータが参照するコードがマスタにある", () => {
  // マスタに無いコードを届が持っていると CodePicker が選択式にならず、
  // 「未登録です」の案内が出たまま手打ちになる。
  const db = makeSeedDb();
  const has = (kind: string, code?: string) =>
    !code || db.codes.some((c) => c.kind === kind && c.code === code);

  it("剤形コードはすべてマスタにある", () => {
    const missing = db.notifications
      .flatMap((n) => n.studyDrugs)
      .map((d) => d.dosageFormCode)
      .filter((c) => !has("dosageForm", c));
    expect([...new Set(missing)]).toEqual([]);
  });

  it("投与経路コードはすべてマスタにある", () => {
    const missing = db.notifications
      .flatMap((n) => n.studyDrugs)
      .map((d) => d.adminRouteCode)
      .filter((c) => !has("adminRoute", c));
    expect([...new Set(missing)]).toEqual([]);
  });

  it("薬効分類番号はすべてマスタにある", () => {
    // 以前デモデータに4桁の 4291 が入っていた。手引き 5.2(10) は3桁なので 429 に直した。
    const missing = db.notifications
      .flatMap((n) => n.studyDrugs)
      .map((d) => d.efficacyClassCode)
      .filter((c) => !has("therapeuticClass", c));
    expect([...new Set(missing)]).toEqual([]);
  });
});
