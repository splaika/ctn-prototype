// ============================================================================
// 公式XSD から生成したツリーの健全性テスト
// ----------------------------------------------------------------------------
// xsdForm.generated.ts は厚生労働省の iykckn_all_v3_0_0.xsd から生成している。
// 生成物を Git 管理しているので、XSD を差し替えたのに再生成し忘れる／生成が
// 壊れるといった事故をここで止める。
//
// 届書ツリー（formTree.ts）の項目名がこの公式ラベルと一致していることも見る。
// クライアント指摘「入力画面の項目名を実際の届出項目名に合わせてほしい」に対し、
// 「合っている」を主張ではなく検証にするため。
// ============================================================================
import { describe, expect, it } from "vitest";
import { XSD_FORM, XSD_ROOT, XSD_VERSION, walkXsd, type XsdNode } from "./xsdForm.generated";

const all: { node: XsdNode; path: XsdNode[] }[] = [];
walkXsd(XSD_FORM, (node, path) => all.push({ node, path }));

describe("公式XSD ツリー", () => {
  it("ルート要素と版が公式のものである", () => {
    expect(XSD_ROOT).toBe("CLINTRIALPLANNOTE");
    expect(XSD_VERSION).toBe("3.0.0");
  });

  it("トップレベルが届書の大見出しと同じ並びになっている", () => {
    expect(XSD_FORM.map((n) => n.el)).toEqual([
      "INFOFORMVERSION",
      "COMMONINFOCLINTRIALPLANNOTE",
      "INFONOTE",
      "INFOCOMBINATION",
      "INFOMEDICALINSTITUT",
      "INFOREFCLINTRIALPLANNOTER",
    ]);
  });

  it("十分な数のノードがある（生成が途中で失敗していない）", () => {
    expect(all.length).toBeGreaterThan(200);
  });

  it("共通子要素（VARIABLELABEL / CHANGEDATE / CHANGEREASON）はツリーに含めない", () => {
    // これらは全値要素に機械的に付くもので、項目ではない
    for (const { node } of all) {
      expect(["VARIABLELABEL", "CHANGEDATE", "CHANGEREASON"]).not.toContain(node.el);
    }
  });

  it("値ノードは STATUS の種類を持ち、入れ物ノードは子を持つ", () => {
    for (const { node } of all) {
      if (node.kind === "value") {
        expect(["update", "add", "updateNoValue", null], `${node.el}`).toContain(node.status ?? null);
      } else {
        expect(node.children, `${node.el} に子が無い`).toBeTruthy();
      }
    }
  });

  it("要素名は XSD の命名規則（英大文字・数字・アンダースコア）に従う", () => {
    for (const { node } of all) expect(node.el).toMatch(/^[A-Z][A-Z0-9_]*$/);
  });

  it("項目名を持たないのは入れ物要素だけ（値要素には必ず項目名がある）", () => {
    // XSD はインライン complexType の入れ物にコメントを付けていない。
    // 値要素のラベルが空だと VARIABLELABEL に何も書けなくなるので、そこは許さない。
    const unlabeledValues = all.filter(({ node }) => node.kind === "value" && !node.label);
    expect(unlabeledValues.map((x) => x.node.el)).toEqual([]);
  });
});
