#!/usr/bin/env python3
"""公式XSD（iykckn_all_v3_0_0.xsd）から届書の要素ツリーを TypeScript へ生成する。

なぜ生成するのか:
  届書の項目名・要素名・入れ子・STATUS の種類は厚生労働省のXSDが正である。
  これを手で写すと必ずずれる（実際、以前のデモ用サブセットは要素名の一致が40%
  しかなかった）。XSDを単一ソースにして生成すれば、画面ラベル・XML・PDFの
  すべてが公式と100%一致する。

出力: src/ctn/xsdForm.generated.ts（Git 管理する。再生成は npm run xsd:gen）

XSDの規則（読み解いた結果）:
  ・値を持つ要素は mixed="true" の ATTR_*_TYPE で、
    <VARIABLELABEL>項目名</VARIABLELABEL> を必ず内包し、値は混在テキストで置く。
    STATUS 属性の取りうる値が型ごとに違う:
      ATTR_UPDATE_TYPE         … UPDATE / NONE（単票項目）
      ATTR_ADD_TYPE            … NONE / APPEND / DELETE（繰り返し行）
      ATTR_UPDATE_NOVALUE_TYPE … NONE / UPDATE（+ NOVALUE 属性）
  ・入れ物の要素は名前付き complexType（*_TYPE）かインライン complexType。
  ・項目名（VARIABLELABEL に入れる文字列）は element 直後のXMLコメント。
  ・choice/all は使われておらず、すべて sequence（＝出現順が固定）。
"""
from __future__ import annotations

import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
XSD = os.path.normpath(os.path.join(HERE, "..", "..", "..", "archive", "outputs", "ctn-xsd-mapping", "iykckn_all_v3_0_0.xsd"))
OUT = os.path.normpath(os.path.join(HERE, "..", "src", "ctn", "xsdForm.generated.ts"))

ROOT = "CLINTRIALPLANNOTE"
STATUS_KIND = {
    "ATTR_UPDATE_TYPE": "update",
    "ATTR_ADD_TYPE": "add",
    "ATTR_UPDATE_NOVALUE_TYPE": "updateNoValue",
}


def read_xsd() -> str:
    if not os.path.exists(XSD):
        sys.exit(f"公式XSDが見つかりません: {XSD}\nリポジトリ内の配置が変わった場合はこのパスを直してください。")
    return io.open(XSD, encoding="utf-8").read()


def find_block(s: str, start: int, tag: str) -> tuple[int, int]:
    """start 位置から始まる tag の開始〜終了（入れ子対応）を返す"""
    open_re = re.compile(rf"<xsd:{tag}[^>]*?(/?)>")
    close = f"</xsd:{tag}>"
    m = open_re.search(s, start)
    if not m:
        return (-1, -1)
    if m.group(1) == "/":
        return (m.end(), m.end())
    depth = 1
    i = m.end()
    while depth > 0:
        nxt_open = open_re.search(s, i)
        nxt_close = s.find(close, i)
        if nxt_close == -1:
            sys.exit(f"XSD の {tag} が閉じていません")
        if nxt_open and nxt_open.start() < nxt_close:
            # 自己終了タグは深さを変えない。ここを見落とすと閉じ判定がずれる
            if nxt_open.group(1) == "/":
                i = nxt_open.end()
                continue
            depth += 1
            i = nxt_open.end()
        else:
            depth -= 1
            i = nxt_close + len(close)
    return (m.end(), i - len(close))


ELEMENT_RE = re.compile(r'<xsd:element\s+name="([^"]+)"([^>]*?)(/?)>')


def direct_elements(body: str) -> list[dict]:
    """body の直下にある element を出現順に拾う（入れ子の中は見ない）"""
    out: list[dict] = []
    i = 0
    while True:
        m = ELEMENT_RE.search(body, i)
        if not m:
            break
        name, attrs, self_closing = m.group(1), m.group(2), m.group(3) == "/"
        if self_closing:
            after = m.end()
            i = after
            inline = None
        else:
            s_in, e_in = find_block(body, m.start(), "element")
            inline = body[s_in:e_in]
            after = e_in + len("</xsd:element>")
            i = after
        # 直後のコメントが項目名
        tail = body[after: after + 400]
        lm = re.match(r"\s*<!--\s*(.*?)\s*-->", tail, re.S)
        label = re.sub(r"\s+", " ", lm.group(1)).strip() if lm else ""
        out.append({
            "name": name,
            "type": (re.search(r'type="([^"]+)"', attrs) or [None, ""])[1] if re.search(r'type="([^"]+)"', attrs) else "",
            "unbounded": 'maxOccurs="unbounded"' in attrs,
            "optional": 'minOccurs="0"' in attrs,
            "label": label,
            "inline": inline,
        })
    return out


def collect_named_types(s: str) -> dict[str, str]:
    types: dict[str, str] = {}
    for m in re.finditer(r'<xsd:complexType\s+name="([^"]+)"', s):
        st, en = find_block(s, m.start(), "complexType")
        types[m.group(1)] = s[st:en]
    return types


def build(elements: list[dict], types: dict[str, str], seen: tuple[str, ...]) -> list[dict]:
    nodes = []
    for e in elements:
        name = e["name"]
        if name in ("VARIABLELABEL", "CHANGEDATE", "CHANGEREASON"):
            continue  # 共通子要素。出力側で機械的に付ける
        t = e["type"]
        node = {
            "el": name,
            "label": e["label"],
            "repeat": e["unbounded"],
            "optional": e["optional"],
        }
        if t in STATUS_KIND:
            node["kind"] = "value"
            node["status"] = STATUS_KIND[t]
        else:
            node["kind"] = "group"
            body = e["inline"] if e["inline"] is not None else types.get(t)
            if body is None:
                # 型が xsd:string 等の素の値（VARIABLELABEL を持たない）
                node["kind"] = "value"
                node["status"] = None
            elif t and t in seen:
                node["children"] = []  # 再帰防止（現行XSDでは発生しない）
            else:
                node["children"] = build(direct_elements(body), types, seen + ((t,) if t else ()))
        nodes.append(node)
    return nodes


def ts_literal(nodes: list[dict], indent: int = 2) -> str:
    pad = " " * indent
    out = []
    for n in nodes:
        parts = [f'el: "{n["el"]}"', f'label: {json.dumps(n["label"], ensure_ascii=False)}']
        if n["kind"] == "value":
            parts.append(f'kind: "value"')
            parts.append(f'status: {json.dumps(n.get("status"))}')
        else:
            parts.append(f'kind: "group"')
        if n["repeat"]:
            parts.append("repeat: true")
        if n["optional"]:
            parts.append("optional: true")
        head = pad + "{ " + ", ".join(parts)
        if n.get("children"):
            out.append(head + ", children: [\n" + ts_literal(n["children"], indent + 2) + pad + "] },")
        else:
            out.append(head + " },")
    return "\n".join(out) + "\n"


def main() -> None:
    s = read_xsd()
    types = collect_named_types(s)
    st, en = find_block(s, s.index(f'<xsd:element name="{ROOT}"'), "element")
    root_nodes = build(direct_elements(s[st:en]), types, ())

    def count(ns):
        return sum(1 + count(n.get("children") or []) for n in ns)

    ver = (re.search(r"最新の版番号：\s*([0-9.]+)", s) or [None, "?"])[1]
    body = f'''// ============================================================================
// xsdForm.generated.ts — 公式XSD から生成（手で編集しないこと）
// ----------------------------------------------------------------------------
// 生成元 : archive/outputs/ctn-xsd-mapping/iykckn_all_v3_0_0.xsd（厚生労働省・v{ver}）
// 生成子 : demo/app/scripts/gen-xsd-form.py（npm run xsd:gen）
//
// 届書の項目名・要素名・入れ子・出現順・STATUS の種類はすべてXSDが正。
// 画面ラベル・CTN XML・届書PDF はこのツリーを読むことで公式と一致する。
// ============================================================================

/** 値要素の STATUS の種類。XSD の ATTR_*_TYPE に対応する */
export type XsdStatusKind = "update" | "add" | "updateNoValue" | null;

export interface XsdNode {{
  /** XSD の要素名 */
  el: string;
  /** VARIABLELABEL に入る項目名。画面ラベルもこれを使う */
  label: string;
  kind: "value" | "group";
  /** value のときだけ意味を持つ */
  status?: XsdStatusKind;
  /** maxOccurs="unbounded"（繰り返し行） */
  repeat?: boolean;
  /** minOccurs="0" */
  optional?: boolean;
  children?: XsdNode[];
}}

export const XSD_ROOT = "{ROOT}";
export const XSD_VERSION = "{ver}";

export const XSD_FORM: XsdNode[] = [
{ts_literal(root_nodes)}];

/** 深さ優先で全ノードを走査する */
export function walkXsd(
  nodes: XsdNode[],
  visit: (node: XsdNode, path: XsdNode[]) => void,
  path: XsdNode[] = []
): void {{
  for (const node of nodes) {{
    visit(node, path);
    if (node.children) walkXsd(node.children, visit, [...path, node]);
  }}
}}

/** 要素名 → ノード（重複する要素名は最初に現れたもの） */
export const XSD_BY_ELEMENT: Record<string, XsdNode> = (() => {{
  const map: Record<string, XsdNode> = {{}};
  walkXsd(XSD_FORM, (n) => {{
    if (!map[n.el]) map[n.el] = n;
  }});
  return map;
}})();
'''
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(body)
    print(f"生成: {os.path.relpath(OUT, HERE)}（{count(root_nodes)} ノード / XSD v{ver}）")


if __name__ == "__main__":
    main()
