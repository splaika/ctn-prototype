// ============================================================================
// 入力画面のラベル ↔ 届書の項目名の突合テスト
// ----------------------------------------------------------------------------
// officialLabels.ts は「入力欄が届書のどこに出るか」を宣言した表である。
// 宣言なので、実際の届書ツリー（formTree.ts）とずれても実行時には気づけない。
// ここでツリー側を正として全件突合し、ずれたら落とす。
//
// これが無いと、届書側の項目名を直したときに画面のラベルだけ旧名で残る。
// クライアントからの指摘（項目名が届出と一致していない）の再発防止そのもの。
// ============================================================================
import { describe, expect, it } from "vitest";
import { buildFormDocument, type FormContext, type FormNode } from "./formTree";
import { LABELS, isInternal, ofHint, ofLabel } from "./officialLabels";
import { makeSeedDb } from "./data/seed";

const db = makeSeedDb();
/** 明細が一通り揃っている届。項目が空でもツリーには出る（公式様式の性質） */
const n = db.notifications.find((x) => x.studyDrugs.length > 0 && x.sites.length > 0)!;
const ctx: FormContext = {
  compound: db.compounds.find((c) => c.id === n.compoundId)!,
  sponsor: db.sponsors.find((s) => s.id === n.sponsorId)!,
  institutions: new Map(db.institutions.map((i) => [i.id, i])),
  irbs: new Map(db.irbs.map((i) => [i.id, i])),
};

/** 届書ツリーの全ノードのパス（"A › B › C" 形式）を集める */
function collectPaths(nodes: FormNode[], prefix: string[] = [], out = new Set<string>()): Set<string> {
  for (const node of nodes) {
    const path = [...prefix, node.label];
    out.add(path.join(" › "));
    if (node.children) collectPaths(node.children, path, out);
  }
  return out;
}

const PATHS = collectPaths(buildFormDocument(n, ctx).body);

describe("入力欄のラベルが届書の項目名と一致している", () => {
  const official = Object.entries(LABELS).filter(([, e]) => !isInternal(e));

  it("突合対象が十分にある（表が空になっていない）", () => {
    expect(official.length).toBeGreaterThan(50);
  });

  for (const [key, e] of official) {
    if (isInternal(e)) continue;
    it(`「${key}」→ 届書の「${e.path.join(" › ")}」が実在する`, () => {
      expect(PATHS.has(e.path.join(" › ")), `届書ツリーにこのパスが無い: ${e.path.join(" › ")}`).toBe(true);
    });

    it(`「${key}」の表示名が届書の項目名と同一（${e.ja}）`, () => {
      expect(e.ja).toBe(e.path[e.path.length - 1]);
    });
  }
});

describe("届書に出ない運用項目", () => {
  it("理由を明示している（届書項目と混同されないようにするため）", () => {
    for (const [key, e] of Object.entries(LABELS)) {
      if (!isInternal(e)) continue;
      expect(e.internal.length, `${key} に理由が無い`).toBeGreaterThan(10);
      expect(ofHint(key)).toContain("届書には出力されません");
    }
  });
});

describe("ヘルパー", () => {
  it("表に無いキーはそのまま返す（段階的に移行できるようにするため）", () => {
    expect(ofLabel("未登録の項目")).toBe("未登録の項目");
    expect(ofHint("未登録の項目")).toBe("");
  });

  it("公式項目名を返し、ヒントには親の階層だけを出す", () => {
    expect(ofLabel("実施計画書識別記号")).toBe("実施計画書識別記号");
    expect(ofHint("実施計画書識別記号")).toBe("届書：主たる被験薬に関する届出事項 › 治験計画の概要");
  });

  it("英語ラベルも引ける", () => {
    expect(ofLabel("実施計画書識別記号", "en")).toBe("Protocol ID");
  });
});
