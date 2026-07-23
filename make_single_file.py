"""Bundle the whole site into one self-contained HTML file.

    python make_single_file.py

Produces FreeFlow-Finance.html in this folder: everything inlined, no separate
files, opens straight from a Downloads folder or a USB stick. Useful for
sharing a snapshot before the site is hosted, or for handing someone a copy
that doesn't depend on your site staying up.

Run it after build.py (and after fetch_history.py, if you want the charts
included) so it picks up the latest numbers.
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "docs")
OUT = os.path.join(HERE, "FreeFlow-Finance.html")

SCRIPTS = ["data.js", "history.js", "charts.js", "views.js", "app.js"]


def read(name, required=True):
    path = os.path.join(DOCS, name)
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        if required:
            print(f"ERROR: {path} is missing. Run build.py first.")
            sys.exit(1)
        return None


def main():
    html = read("index.html")
    css = read("styles.css")

    html = html.replace('<link rel="stylesheet" href="styles.css">',
                        f"<style>\n{css}\n</style>")

    parts = []
    for name in SCRIPTS:
        body = read(name, required=(name != "history.js"))
        if body is None:
            print("Note: docs/history.js not found — charts will show their "
                  "empty state. Run fetch_history.py first to include them.")
            parts.append("var FF_HISTORY = {};")
            continue
        parts.append(body)

    block = "\n".join(f"<script>\n{p}\n</script>" for p in parts)

    # Replace the whole script section, including the history fallback line
    # and the onerror-guarded history tag, with one inlined block.
    pattern = (
        r'<script src="data\.js"></script>.*?<script src="app\.js"></script>'
    )
    html, n = re.subn(pattern, lambda m: block, html, flags=re.DOTALL)
    if n != 1:
        print(f"ERROR: expected to replace 1 script block, replaced {n}. "
              "Has docs/index.html been edited?")
        return 1

    for leftover in ('src="data.js"', 'src="styles.css"', 'src="app.js"'):
        if leftover in html:
            print(f"ERROR: {leftover} still referenced after inlining.")
            return 1

    with open(OUT, "w") as f:
        f.write(html)

    print(f"Wrote {OUT} ({len(html)/1024:.0f} KB)")
    print("\nTo share it: rename the file to index.html and drag it onto")
    print("app.netlify.com/drop — you get a live link in about a minute.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
