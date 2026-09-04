#!/usr/bin/env python3
"""手引きの本文テキストから剤形コードの表を起こして officialCodes.ts と突合する。

data/officialCodes.ts は公式資料からの転記なので、間違え方は「写し間違い」だけ。
これで手引きの本文と機械的に突合する（実際に BZ の1件を見つけた）。

手引きPDFはリポジトリに入っていない（OneDrive: ITS/CTN）ため、テストにはできない。
先に手引きをテキストへ書き出してから使う:

  python -c "import fitz,io;d=fitz.open(r'…/2024年3月版_治験届の手引き.pdf');     io.open('tebiki.txt','w',encoding='utf-8').write(''.join(p.get_text() for p in d))"
  python demo/app/scripts/check-official-codes.py tebiki.txt demo/app/src/ctn/data/officialCodes.ts

（PDFの抽出結果が文字化けして見えるのは端末の出力エンコーディングのため。
  ファイルへ書き出せば読める。）
"""
import io
import re
import sys

TEBIKI, TS = sys.argv[1], sys.argv[2]

GROUPS = [
    "経口投与する製剤", "口腔内に適用する製剤", "注射により投与する製剤",
    "透析に用いる製剤", "気管支・肺に適用する製剤", "目に投与する製剤",
    "耳に投与する製剤", "鼻に適用する製剤", "直腸に適用する製剤",
    "膣に適用する製剤", "皮膚等に適用する製剤",
]

lines = io.open(TEBIKI, encoding="utf-8").read().split("\n")
start = next(i for i, l in enumerate(lines) if "治験の計画の届出等に記載する剤形コード" in l)
end = next(i for i, l in enumerate(lines[start:], start) if "H24.10.1" in l)

CODE = re.compile(r"^([A-Z][0-9A-Z])$")
pairs: list[tuple[str, str]] = []
names: list[str] = []
codes: list[str] = []


def flush() -> None:
    """溜まった名称と溜まったコードを出現順に対応付ける（表が2段組みで交互に出る）"""
    global names, codes
    if names and codes:
        assert len(names) == len(codes), f"対応が取れない: {names} / {codes}"
        pairs.extend(zip(names, codes))
        names, codes = [], []


for raw in lines[start + 1 : end]:
    s = raw.strip()
    if not s:
        continue
    if s in GROUPS:
        flush()
        continue
    m = CODE.match(s)
    if m:
        codes.append(m.group(1))
    else:
        if codes:
            flush()
        names.append(s)
flush()

expected = dict((c, n) for n, c in pairs)

# --- officialCodes.ts 側 ---
src = io.open(TS, encoding="utf-8").read()
block = src[src.index("const DOSAGE_FORMS"): src.index("const ADMIN_ROUTES")]
actual = {
    m.group(2): (m.group(1), m.group(3))
    for m in re.finditer(r'\["([^"]+)", "([A-Z][0-9A-Z])", "([^"]+)"\]', block)
}

print(f"手引き: {len(expected)} 件 / officialCodes.ts: {len(actual)} 件")
bad = 0
for code in sorted(set(expected) | set(actual)):
    exp = expected.get(code)
    act = actual.get(code)
    if act is None:
        print(f"  NG {code}: 手引きにあるが officialCodes.ts に無い（{exp}）")
        bad += 1
    elif exp is None:
        print(f"  NG {code}: officialCodes.ts にあるが手引きに無い（{act[1]}）")
        bad += 1
    elif act[1] != exp:
        print(f"  NG {code}: 手引き「{exp}」 / 実装「{act[1]}」")
        bad += 1
print("一致" if bad == 0 else f"不一致 {bad} 件")
