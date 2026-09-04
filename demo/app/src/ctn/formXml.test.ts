// ============================================================================
// 届書ツリー × XML の突合テスト
// ----------------------------------------------------------------------------
// 公式の届書出力は XML の要素ツリーを日本語項目名で表示したものなので、
// 「PDF に印字されている値は必ず XML にも入っている」が成り立っていなければ
// ならない。ここが崩れると、提出XMLから届書を再現できなくなる。
//
// PDF 側（pdfForm.ts）と XML 側（xml.ts）は同じ formTree.ts を読むので、
// 項目の追加漏れはこのテストで落ちる。
// ============================================================================
import { describe, expect, it } from "vitest";
import { makeSeedDb } from "./data/seed";
import { buildFormDocument, walkForm, type FormContext } from "./formTree";
import { checkXmlCoversForm, generateCtnXml } from "./xml";
import { DRUG_ROLE } from "./refData";
import type { Notification } from "./types";

const db = makeSeedDb();

function contextFor(n: Notification): FormContext {
  const compound = db.compounds.find((c) => c.id === n.compoundId)!;
  const sponsor = db.sponsors.find((s) => s.id === n.sponsorId)!;
  return {
    compound,
    sponsor,
    institutions: new Map(db.institutions.map((i) => [i.id, i])),
    irbs: new Map(db.irbs.map((i) => [i.id, i])),
  };
}

/** 明細が一通り揃っている届（構造の検証に使う） */
const rich = db.notifications.find((n) => n.studyDrugs.length > 0 && n.sites.length > 0)!;

describe("届書ツリー", () => {
  it("公式様式の骨格が値の有無にかかわらず出る（空欄でも項目名は印字される）", () => {
    const empty = { ...rich, studyDrugs: [], sites: [], attachments: [], references: [] } as Notification;
    const form = buildFormDocument(empty, contextFor(rich));
    const labels: string[] = [];
    walkForm(form.body, (node) => labels.push(node.label));

    // 参照出力（AMG 410）に現れる主要な見出しが、データが空でも欠けないこと
    for (const required of [
      "治験届出共通事項",
      "主たる被験薬に関する届出事項",
      "中止情報",
      "主たる被験薬の成分及び分量情報",
      "剤形コード情報",
      "治験計画の概要",
      "予定被験者数情報",
      "実施期間",
      "主たる被験薬のその他の情報",
      "当該届出に関するその他の情報",
      "届書添付資料",
      "治験届出者に関する情報",
      "海外依頼者、外国製造業者に関する情報",
      "実施医療機関情報",
      "実施医療機関ごとの事項",
      "治験責任医師に関する情報",
      "治験分担医師に関する情報",
      "治験審査委員会に関する情報",
      "参照する治験届出情報",
    ]) {
      expect(labels, `見出し「${required}」が欠けている`).toContain(required);
    }
  });

  it("主たる被験薬の値がツリーに載る", () => {
    const main = rich.studyDrugs.find((d) => d.drugRole === DRUG_ROLE.main);
    if (!main) return;
    const form = buildFormDocument(rich, contextFor(rich));
    const byLabel = new Map<string, string | undefined>();
    walkForm(form.body, (node) => {
      if (!byLabel.has(node.label)) byLabel.set(node.label, node.value);
    });
    expect(byLabel.get("主たる被験薬の治験成分記号")).toBe(contextFor(rich).compound.compoundCode);
    expect(byLabel.get("成分及び分量")).toBe(main.ingredients);
  });

  it("日付は区切りなしの YYYYMMDD で出る（公式様式の書式）", () => {
    const form = buildFormDocument(rich, contextFor(rich));
    const dates: string[] = [];
    walkForm(form.body, (node) => {
      if (node.label.endsWith("年月日") && node.value) dates.push(node.value);
    });
    for (const d of dates) expect(d, `${d} が YYYYMMDD でない`).toMatch(/^\d{8}$/);
  });
});

describe("XML が届書の全項目を含む", () => {
  for (const n of db.notifications) {
    it(`${n.notifType} / 第${n.filingCount}回 の届書項目がすべて XML にある`, () => {
      const cov = checkXmlCoversForm(n, contextFor(n));
      expect(cov.missing, `XML に無い項目:\n${cov.missing.join("\n")}`).toEqual([]);
      expect(cov.covered).toBe(cov.total);
    });
  }

  it("XML は整形式（開閉タグが対応している）", () => {
    const xml = generateCtnXml(rich, contextFor(rich));
    const opens = xml.match(/<([A-Z][A-Z0-9_]*)(\s[^>]*)?>/g) ?? [];
    const closes = xml.match(/<\/([A-Z][A-Z0-9_]*)>/g) ?? [];
    // 単一行のリーフは開閉が同数、コンテナも同数になる
    expect(opens.length).toBe(closes.length);
  });
});
