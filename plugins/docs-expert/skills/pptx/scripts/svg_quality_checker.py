#!/usr/bin/env python3
"""Validate SVG files against the DrawingML-compatible subset.

Checks that SVGs conform to the allowed subset defined in
references/svg-subset.md before conversion via svg_to_pptx.py.

Usage:
    python3 svg_quality_checker.py slide1.svg [slide2.svg ...]
    python3 svg_quality_checker.py svg_output/    # directory mode

Exit code: 0 if all pass, 1 if any fail.
"""

import re
import sys
from pathlib import Path

from lxml import etree

SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"

# ---------------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------------

ALLOWED_ELEMENTS = {
    "svg", "g", "rect", "circle", "ellipse", "line", "polyline", "polygon",
    "path", "text", "tspan", "image", "defs", "linearGradient",
    "radialGradient", "stop", "clipPath",
    # Structural / metadata (harmless, ignored by converter)
    "title", "desc", "metadata",
}

BANNED_ELEMENTS = {
    "mask": "No DrawingML equivalent",
    "style": "Use inline presentation attributes instead",
    "foreignObject": "Cannot convert HTML to DrawingML",
    "textPath": "No curved-text support in DrawingML",
    "animate": "Static slides only",
    "animateTransform": "Static slides only",
    "animateMotion": "Static slides only",
    "set": "Static slides only",
    "script": "Security risk, no runtime in PPTX",
    "symbol": "Inline the content directly",
    "use": "Inline the referenced element",
    "filter": "Drop shadows/blurs have no reliable DrawingML mapping",
    "pattern": "Use solid or gradient fills",
    "marker": "Draw arrowheads as explicit paths",
}

BANNED_ATTRIBUTES = {"class", "style"}

CJK_FONT_KEYWORDS = {"noto sans", "microsoft yahei", "simhei", "simsun",
                      "pingfang", "hiragino", "source han", "wenquanyi"}


# ---------------------------------------------------------------------------
# Checker
# ---------------------------------------------------------------------------

class Issue:
    def __init__(self, line, level, message):
        self.line = line
        self.level = level  # "error" or "warning"
        self.message = message

    def __str__(self):
        marker = "\u2717" if self.level == "error" else "\u26a0"
        return f"  {marker} Line {self.line}: {self.message}"


def check_svg(path):
    """Check a single SVG file. Returns list of Issue objects."""
    issues = []

    try:
        tree = etree.parse(str(path))
    except etree.XMLSyntaxError as e:
        return [Issue(0, "error", f"XML parse error: {e}")]

    root = tree.getroot()

    # Check viewBox
    vb = root.get("viewBox")
    if not vb:
        issues.append(Issue(1, "error", "Missing viewBox attribute on <svg>"))
    else:
        parts = re.split(r"[,\s]+", vb.strip())
        if len(parts) == 4:
            try:
                vb_w, vb_h = float(parts[2]), float(parts[3])
                ratio = vb_w / vb_h if vb_h else 0
                if not (1.7 < ratio < 1.8):
                    issues.append(Issue(
                        1, "warning",
                        f"viewBox aspect ratio {ratio:.3f} is not 16:9 (expected ~1.778)"
                    ))
            except ValueError:
                issues.append(Issue(1, "error", f"Invalid viewBox values: {vb}"))
        else:
            issues.append(Issue(1, "error", f"viewBox must have 4 values, got {len(parts)}"))

    # Walk all elements
    for el in root.iter():
        tag = etree.QName(el).localname
        line = el.sourceline or 0

        # Check banned elements
        if tag in BANNED_ELEMENTS:
            reason = BANNED_ELEMENTS[tag]
            issues.append(Issue(line, "error", f"banned element <{tag}> -- {reason}"))
            continue

        # Check unknown elements (not in allowed set, not banned)
        ns = etree.QName(el).namespace
        if ns == SVG_NS and tag not in ALLOWED_ELEMENTS and tag not in BANNED_ELEMENTS:
            issues.append(Issue(line, "warning", f"unknown element <{tag}>, will be skipped"))

        # Check banned attributes
        for attr in BANNED_ATTRIBUTES:
            if el.get(attr) is not None:
                issues.append(Issue(
                    line, "error",
                    f'banned attribute "{attr}" on <{tag}> -- use inline presentation attributes'
                ))

        # Check rgba() in color attributes
        for attr in ("fill", "stroke", "stop-color", "flood-color", "lighting-color"):
            val = el.get(attr, "")
            if "rgba(" in val:
                issues.append(Issue(
                    line, "error",
                    f"rgba() color in {attr} -- use fill-opacity/stroke-opacity instead"
                ))
            if "rgb(" in val:
                issues.append(Issue(
                    line, "warning",
                    f"rgb() color in {attr} -- use hex #RRGGBB for reliable conversion"
                ))

        # Check group-level opacity
        if tag == "g" and el.get("opacity") is not None:
            issues.append(Issue(
                line, "error",
                'opacity on <g> -- set fill-opacity/stroke-opacity on each child instead'
            ))

        # Check font-family for CJK fallback
        if tag in ("text", "tspan"):
            ff = (el.get("font-family") or "").lower()
            if ff:
                has_cjk = any(kw in ff for kw in CJK_FONT_KEYWORDS)
                if not has_cjk:
                    issues.append(Issue(
                        line, "warning",
                        "font-family missing CJK fallback "
                        '(add "Noto Sans SC" or "Microsoft YaHei")'
                    ))

        # Check external image references
        if tag == "image":
            href = el.get(f"{{{XLINK_NS}}}href") or el.get("href", "")
            if href and not href.startswith("data:"):
                issues.append(Issue(
                    line, "error",
                    "external image URL -- images must be base64 data URIs"
                ))

        # Check matrix() transform
        transform = el.get("transform", "")
        if "matrix(" in transform:
            issues.append(Issue(
                line, "warning",
                "matrix() transform -- decompose into translate/scale/rotate"
            ))

        # Check text overflow (rough estimate)
        if tag == "text":
            text_content = "".join(el.itertext())
            if len(text_content) > 200:
                issues.append(Issue(
                    line, "warning",
                    f"text content is {len(text_content)} chars -- may overflow container"
                ))

    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 svg_quality_checker.py <file.svg|dir> [...]", file=sys.stderr)
        sys.exit(1)

    # Collect SVG files from arguments
    svg_files = []
    for arg in sys.argv[1:]:
        p = Path(arg)
        if p.is_dir():
            svg_files.extend(sorted(p.glob("*.svg")))
        elif p.is_file() and p.suffix == ".svg":
            svg_files.append(p)
        else:
            print(f"Warning: skipping {arg} (not an SVG file or directory)", file=sys.stderr)

    if not svg_files:
        print("No SVG files found.", file=sys.stderr)
        sys.exit(1)

    total = len(svg_files)
    passed = 0
    failed = 0

    for svg_file in svg_files:
        issues = check_svg(svg_file)
        errors = [i for i in issues if i.level == "error"]
        warnings = [i for i in issues if i.level == "warning"]

        if errors:
            status = "FAIL"
            failed += 1
        else:
            status = "PASS"
            passed += 1

        print(f"{svg_file.name}: {status} ({len(errors)} error(s), {len(warnings)} warning(s))")
        for issue in errors + warnings:
            print(str(issue))
        if issues:
            print()

    print(f"Summary: {passed}/{total} passed, {failed}/{total} failed")
    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
