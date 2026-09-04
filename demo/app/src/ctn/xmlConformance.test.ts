// ============================================================================
// CTN XML の公式XSD適合テスト
// ----------------------------------------------------------------------------
// 本物のXSD検証は Python の xmlschema が必要なので、リポジトリの
//   archive/outputs/ctn-xsd-mapping/validate_ctn_xml.py
// で行う（手順は ctn-spfx/docs/引き継ぎ.md）。2026-09-04 時点でデモデータ8件
// すべて PASS を確認済み。
//
// ここでは Python 無しで回せる形で、XSD検証が落ちる原因になる不変条件を見る。
// 過去に踏んだ落とし穴をそのままテストにしている:
//   ・ルート要素名を独自にしていた（CLINICALTRIALNOTIFICATION）
//   ・VARIABLELABEL を出していなかった
//   ・繰り返しを「要素を複数出す」と誤解していた（XSDは要素1つの中で子が繰り返す）
// ============================================================================
import { describe, expect, it } from "vitest";
import { makeSeedDb } from "./data/seed";
import { generateCtnXml, checkXmlCoversForm, type XmlContext } from "./xml";
import { buildFormDocument, walkForm } from "./formTree";
import { XSD_BY_ELEMENT, XSD_FORM, XSD_ROOT } from "./xsdForm.generated";
import type { Notification } from "./types";

const db = makeSeedDb();
const ctxFor = (n: Notification): XmlContext => ({
  compound: db.compounds.find((c) => c.id === n.compoundId)!,
  sponsor: db.sponsors.find((s) => s.id === n.sponsorId)!,
  institutions: new Map(db.institutions.map((i) => [i.id, i])),
  irbs: new Map(db.irbs.map((i) => [i.id, i])),
});

/** 繰り返し枠（XSDの内側 sequence が unbounded な要素） */
const repeatEls = new Set<string>();
(function collect(nodes = XSD_FORM) {
  for (const n of nodes) {
    if (n.repeat) repeatEls.add(n.el);
    if (n.children) collect(n.children);
  }
})();

describe("CTN XML が公式XSDの形で出る", () => {
  for (const n of db.notifications) {
    const xml = generateCtnXml(n, ctxFor(n));
    const tag = `${n.notifType}/第${n.filingCount}回`;

    it(`${tag}: ルート要素と スキーマ参照が公式のもの`, () => {
      expect(xml).toContain(`<${XSD_ROOT} `);
      expect(xml).toContain('xsd:noNamespaceSchemaLocation="iykckn_all_v3_0_0.xsd"');
      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    });

    it(`${tag}: 独自の要素名を出さない（すべてXSDに存在する）`, () => {
      const els = [...xml.matchAll(/<([A-Z][A-Z0-9_]*)[\s>]/g)].map((m) => m[1]);
      const unknown = [...new Set(els)].filter(
        (el) => el !== XSD_ROOT && el !== "VARIABLELABEL" && !XSD_BY_ELEMENT[el]
      );
      expect(unknown, `XSDに無い要素名: ${unknown.join(", ")}`).toEqual([]);
    });

    it(`${tag}: すべての要素が VARIABLELABEL を内包する`, () => {
      // ルートを除く各要素の開始タグの直後に VARIABLELABEL が来ること
      const opens = [...xml.matchAll(/<([A-Z][A-Z0-9_]*)(?:\s[^>]*)?>/g)];
      for (const m of opens) {
        const el = m[1];
        if (el === XSD_ROOT || el === "VARIABLELABEL") continue;
        const after = xml.slice(m.index! + m[0].length, m.index! + m[0].length + 60);
        expect(after.trimStart().startsWith("<VARIABLELABEL>"), `${el} に VARIABLELABEL が無い`).toBe(true);
      }
    });

    it(`${tag}: 繰り返し枠を兄弟として並べない（中で子が繰り返す）`, () => {
      // 同名要素はXSD上の別位置に現れることがあるので総数では見ない。
      // 「閉じた直後に同じ要素が始まる」＝兄弟として並べた状態だけを禁じる。
      // これをやるとXSD検証が「Unexpected child」で落ちる。
      for (const el of repeatEls) {
        const adjacent = new RegExp(`</${el}>\s*<${el}[\s>]`);
        expect(adjacent.test(xml), `${el} が兄弟として複数並んでいる`).toBe(false);
      }
    });

    it(`${tag}: 開始タグと終了タグの数が一致する`, () => {
      const opens = (xml.match(/<[A-Z][A-Z0-9_]*(?:\s[^>]*)?>/g) ?? []).length;
      const closes = (xml.match(/<\/[A-Z][A-Z0-9_]*>/g) ?? []).length;
      expect(opens).toBe(closes);
    });

    it(`${tag}: 届書に出る値がすべてXMLにある`, () => {
      const cov = checkXmlCoversForm(n, ctxFor(n));
      expect(cov.unknownElements).toEqual([]);
      expect(cov.missing, `XMLに無い項目:\n${cov.missing.join("\n")}`).toEqual([]);
    });
  }
});

describe("届書ツリーと公式XSDの対応", () => {
  const n = db.notifications.find((x) => x.studyDrugs.length > 1 && x.sites.length > 1) ?? db.notifications[0];

  it("ツリーの全ノードがXSDの要素である", () => {
    const form = buildFormDocument(n, ctxFor(n));
    const bad: string[] = [];
    walkForm(form.body, (node) => {
      if (node.el !== XSD_ROOT && !XSD_BY_ELEMENT[node.el]) bad.push(node.el);
    });
    expect(bad).toEqual([]);
  });

  it("項目名がXSDの項目名と一致する（入れ物9要素だけ公式出力から補う）", () => {
    // APPLICABLEORNOT / DETAIL / CONTENTS のように、同じ要素名がXSD上の別位置で
    // 別の項目名を持つものがある（「該当の有無」と「該当の有無等」など）。
    // 要素名だけで1つに決められないので、XSDに現れる全ての項目名を許容集合とする。
    const allowed = new Map<string, Set<string>>();
    (function collect(nodes = XSD_FORM) {
      for (const x of nodes) {
        if (x.label) {
          const set = allowed.get(x.el) ?? new Set<string>();
          set.add(x.label);
          allowed.set(x.el, set);
        }
        if (x.children) collect(x.children);
      }
    })();

    const form = buildFormDocument(n, ctxFor(n));
    const mismatched: string[] = [];
    walkForm(form.body, (node) => {
      const set = allowed.get(node.el);
      if (!set) return; // XSDにコメントが無い入れ物は対象外
      if (!set.has(node.label)) mismatched.push(`${node.el}: ${node.label} ∉ {${[...set].join(", ")}}`);
    });
    expect(mismatched).toEqual([]);
  });

  it("値が無くても項目名は出る（公式様式は空欄でも印字する）", () => {
    const empty = { ...n, studyDrugs: [], sites: [], attachments: [], references: [] } as Notification;
    const form = buildFormDocument(empty, ctxFor(n));
    let count = 0;
    walkForm(form.body, () => count++);
    expect(count).toBeGreaterThan(150);
  });
});
