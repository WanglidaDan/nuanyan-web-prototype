"""Build the CSP-compatible static frontend into dist/."""

from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "src"
OUTPUT = ROOT / "dist"

INLINE_STYLE = re.compile(r"\sstyle\s*=", re.IGNORECASE)
INLINE_STYLE_TAG = re.compile(r"<\s*style\b", re.IGNORECASE)
INLINE_SCRIPT = re.compile(r"<\s*script\b(?![^>]*\bsrc\s*=)[^>]*>", re.IGNORECASE)


def validate_csp_source() -> None:
    for html_file in SOURCE.rglob("*.html"):
        html = html_file.read_text(encoding="utf-8")
        if INLINE_STYLE.search(html) or INLINE_STYLE_TAG.search(html) or INLINE_SCRIPT.search(html):
            raise SystemExit(f"CSP violation in {html_file.relative_to(ROOT)}")

    js_file = SOURCE / "js" / "app.js"
    script = js_file.read_text(encoding="utf-8")
    if INLINE_STYLE.search(script) or re.search(r"\.style\b", script):
        raise SystemExit("CSP violation: avoid generated style attributes and element.style updates")


def main() -> None:
    validate_csp_source()
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(SOURCE, OUTPUT)
    print(f"Built CSP-compatible frontend in {OUTPUT}")


if __name__ == "__main__":
    main()
