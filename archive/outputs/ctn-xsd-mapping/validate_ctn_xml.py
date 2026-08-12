#!/usr/bin/env python3
"""CTN 治験届XML を公式XSD (iykckn_all_v3_0_0.xsd) で検証する。
Cat5-A の検証部の参照実装。XSDは構造/出現順/STATUS値/必須を検証するが、
桁・コード値は対象外（業務ロジックで別途検証すること）。

使い方:  pip install xmlschema
         python validate_ctn_xml.py <target.xml> [schema.xsd]
"""
import sys, xmlschema
def main():
    xml = sys.argv[1] if len(sys.argv) > 1 else "sample-CLINTRIALPLANNOTE.xml"
    xsd = sys.argv[2] if len(sys.argv) > 2 else "iykckn_all_v3_0_0.xsd"
    schema = xmlschema.XMLSchema(xsd)
    errors = list(schema.iter_errors(xml))
    if not errors:
        print(f"PASS: {xml} は {xsd} に適合"); return 0
    print(f"FAIL: {len(errors)} 件のエラー")
    for e in errors:
        path = getattr(e, "path", "") or ""
        print(f"  - [{path}] {e.reason or e.message}")
    return 1
if __name__ == "__main__":
    sys.exit(main())
