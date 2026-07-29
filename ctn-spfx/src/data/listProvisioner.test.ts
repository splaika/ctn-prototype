// ============================================================================
// listProvisioner.test.ts — ブラウザからのリスト作成の検証
// ----------------------------------------------------------------------------
// 実テナントでしか確かめられないこと（REST が本当に受け付けるか）は検証できない。
// ここで担保するのは、スキーマから正しい Field XML を作れているか、冪等か、
// 部分失敗を黙って飲み込まないか、PowerShell 版と同じ結果になるかの4点。
// ============================================================================
import { describe, expect, it } from "vitest";

import listSchema from "../../provision/ctn-lists.schema.json";
import { FakeSpClient } from "./fakeSpClient";
import { buildFieldXml, checkProvisioning, provisionCtnLists } from "./listProvisioner";

const LIST_COUNT = listSchema.lists.length;
const GROUP_COUNT = listSchema.groups.length;
const FIELD_COUNT = listSchema.lists.reduce(
  (n, l) => n + l.fields.filter((f) => !(f as { builtIn?: boolean }).builtIn).length,
  0
);

describe("Field XML の生成", () => {
  it("1行テキストは MaxLength 付きで任意列になる", () => {
    const xml = buildFieldXml({ prop: "x", name: "CtnFoo", type: "Text" });
    expect(xml).toContain('Type="Text"');
    expect(xml).toContain('Name="CtnFoo"');
    expect(xml).toContain('StaticName="CtnFoo"');
    // 必須性は logic.ts 側で担保する。列を必須にすると下書き保存が通らなくなる
    expect(xml).toContain('Required="FALSE"');
  });

  it("複数行テキストはプレーン（RichText FALSE）", () => {
    const xml = buildFieldXml({ prop: "x", name: "CtnPayload", type: "Note" });
    expect(xml).toContain('Type="Note"');
    expect(xml).toContain('RichText="FALSE"');
  });

  it("選択肢は CHOICES を展開する", () => {
    const xml = buildFieldXml({
      prop: "x",
      name: "CtnStatus",
      type: "Choice",
      choices: ["draft", "review"],
    });
    expect(xml).toContain("<CHOICES><CHOICE>draft</CHOICE><CHOICE>review</CHOICE></CHOICES>");
  });

  it("参照列は波括弧付きの GUID と ShowField を持つ", () => {
    const xml = buildFieldXml(
      { prop: "compoundId", name: "CtnCompound", type: "Lookup", lookupList: "CtnCompounds" },
      "11111111-2222-3333-4444-555555555555"
    );
    expect(xml).toContain('List="{11111111-2222-3333-4444-555555555555}"');
    expect(xml).toContain('ShowField="Title"');
  });

  it("参照先が解決できなければ黙って作らずに失敗する", () => {
    expect(() =>
      buildFieldXml({ prop: "x", name: "CtnCompound", type: "Lookup", lookupList: "CtnCompounds" })
    ).toThrow(/解決できませんでした/);
  });

  it("XML 特殊文字と日本語の選択肢をエスケープする", () => {
    const xml = buildFieldXml({
      prop: "role",
      name: "CtnStaffRole",
      type: "Choice",
      choices: ["事務局", "A&B", '"引用"', "<tag>"],
    });
    expect(xml).toContain("<CHOICE>事務局</CHOICE>");
    expect(xml).toContain("A&amp;B");
    expect(xml).toContain("&quot;引用&quot;");
    expect(xml).toContain("&lt;tag&gt;");
    // エスケープ漏れがあると XML として壊れる
    expect(xml).not.toContain("<tag>");
  });

  it("未対応の型は黙って飛ばさずに失敗する", () => {
    expect(() => buildFieldXml({ prop: "x", name: "CtnFoo", type: "DateTime" })).toThrow(
      /未対応の列型/
    );
  });
});

describe("リストの有無の判定", () => {
  it("空のサイトでは全リストが未作成と判定される", async () => {
    const sp = new FakeSpClient();
    const { missing, existing } = await checkProvisioning(sp);
    expect(missing).toHaveLength(LIST_COUNT);
    expect(existing).toHaveLength(0);
  });

  it("一部だけあるサイトでは不足分を返す", async () => {
    const sp = new FakeSpClient();
    sp.seedList("CtnCompounds");
    const { missing, existing } = await checkProvisioning(sp);
    expect(existing).toEqual(["CtnCompounds"]);
    expect(missing).toHaveLength(LIST_COUNT - 1);
  });
});

describe("プロビジョニング", () => {
  it("空のサイトでスキーマ通りのリスト・列・グループを作る", async () => {
    const sp = new FakeSpClient();
    const r = await provisionCtnLists(sp);

    expect(r.listsCreated).toHaveLength(LIST_COUNT);
    expect(r.listsExisting).toHaveLength(0);
    expect(r.fieldsCreated).toBe(FIELD_COUNT);
    expect(r.groupsCreated).toHaveLength(GROUP_COUNT);
    expect(r.failures).toEqual([]);

    // 完了後は未作成リストが無くなる
    expect((await checkProvisioning(sp)).missing).toEqual([]);
  });

  it("既定列（Title）は作成しない", async () => {
    const sp = new FakeSpClient();
    await provisionCtnLists(sp);
    const titleFields = sp.fieldXml.filter((f) => /Name="Title"/.test(f.xml));
    expect(titleFields).toEqual([]);
  });

  it("2回目の実行では何も作らない（冪等）", async () => {
    const sp = new FakeSpClient();
    await provisionCtnLists(sp);

    const second = await provisionCtnLists(sp);
    expect(second.listsCreated).toEqual([]);
    expect(second.fieldsCreated).toBe(0);
    expect(second.groupsCreated).toEqual([]);
    expect(second.listsExisting).toHaveLength(LIST_COUNT);
    expect(second.fieldsExisting).toBe(FIELD_COUNT);
    expect(second.failures).toEqual([]);
  });

  it("参照列はすべて実在するリストの GUID を指す", async () => {
    const sp = new FakeSpClient();
    await provisionCtnLists(sp);

    const listIds = new Set((await sp.getLists()).map((l) => l.id));
    const lookups = sp.fieldXml.filter((f) => /Type="Lookup"/.test(f.xml));
    expect(lookups.length).toBeGreaterThan(0);
    for (const l of lookups) {
      const guid = /List="\{([^}]+)\}"/.exec(l.xml)?.[1];
      expect(guid, l.xml).toBeDefined();
      expect(listIds.has(guid as string), `未知のリストID: ${guid}`).toBe(true);
    }
  });

  it("列の作成に失敗しても止まらず、失敗を報告する", async () => {
    const sp = new FakeSpClient();
    sp.failFieldsMatching = /^CtnPayload$/;

    const r = await provisionCtnLists(sp);
    expect(r.failures).toHaveLength(1);
    expect(r.failures[0].where).toBe("CtnNotifications.CtnPayload");
    // 他の列は作られている
    expect(r.fieldsCreated).toBe(FIELD_COUNT - 1);
  });

  it("失敗した列は再実行で作られる", async () => {
    const sp = new FakeSpClient();
    sp.failFieldsMatching = /^CtnPayload$/;
    await provisionCtnLists(sp);

    sp.failFieldsMatching = undefined;
    const second = await provisionCtnLists(sp);
    expect(second.fieldsCreated).toBe(1);
    expect(second.failures).toEqual([]);
  });

  it("進捗が単調に増え、最後は total に達する", async () => {
    const sp = new FakeSpClient();
    const seen: number[] = [];
    let total = 0;
    await provisionCtnLists(sp, (p) => {
      seen.push(p.done);
      total = p.total;
      expect(p.step).not.toBe("");
    });
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen[seen.length - 1]).toBe(total);
  });

  it("既存リストがあっても列の不足分だけを埋める", async () => {
    const sp = new FakeSpClient();
    // CtnIrbs だけ、列が1つ足りない状態で先に存在させる
    sp.seedList("CtnIrbs", ["Title", "CtnIrbType", "CtnOwnerName", "CtnAddress1", "CtnAddress2"]);

    const r = await provisionCtnLists(sp);
    expect(r.listsExisting).toEqual(["CtnIrbs"]);
    expect(r.listsCreated).toHaveLength(LIST_COUNT - 1);
    // CtnIrbs に足すのは CtnActive の1列だけ
    const irbFields = sp.fieldXml.filter((f) => f.list === "CtnIrbs");
    expect(irbFields.map((f) => /Name="([^"]+)"/.exec(f.xml)?.[1])).toEqual(["CtnActive"]);
  });
});

describe("PowerShell 版との整合", () => {
  it("スキーマの全リスト・全列が REST 版でも作成対象になっている", async () => {
    const sp = new FakeSpClient();
    await provisionCtnLists(sp);

    for (const list of listSchema.lists) {
      const present = new Set(await sp.getFieldInternalNames(list.name));
      for (const f of list.fields) {
        if ((f as { builtIn?: boolean }).builtIn) continue;
        expect(present.has(f.name), `${list.name}.${f.name} が作られていない`).toBe(true);
      }
    }
  });
});
