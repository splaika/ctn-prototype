# -*- coding: utf-8 -*-
"""ctn-ux-react-standalone.html を src/ から再組み立てするビルドスクリプト。

  python tools/build.py

src/shell.html   … HTML 骨格 (__CSS__ / __SCRIPT__ プレースホルダ)
src/styles.css   … 全スタイル (編集対象)
src/vendor.js    … React/ReactDOM ほかライブラリ (編集しない)
src/app.js       … アプリ本体 (編集対象)
"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with io.open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def main():
    shell = read("src/shell.html")
    css = read("src/styles.css")
    script = read("src/vendor.js") + "\n" + read("src/app.js")
    html = shell.replace("__CSS__", css).replace("__SCRIPT__", script)
    out = os.path.join(ROOT, "ctn-ux-react-standalone.html")
    with io.open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print("wrote %s (%d bytes)" % (out, os.path.getsize(out)))


if __name__ == "__main__":
    main()
