#!/usr/bin/env python3
"""Convert a directory of SVG files to a native DrawingML PPTX.

Each SVG becomes one slide with editable shapes (not embedded images).

Usage:
    python3 svg_to_pptx.py svg_dir/ output.pptx

Dependencies: python-pptx, lxml
"""

import logging
import re
import sys
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.oxml import parse_xml
from pptx.util import Emu

from svg_colors import collect_defs
from svg_shapes import convert_element, reset_shape_id

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

SLIDE_W = 12192000  # EMU, 16:9
SLIDE_H = 6858000
SVG_NS = "http://www.w3.org/2000/svg"


# ---------------------------------------------------------------------------
# Coordinate helpers
# ---------------------------------------------------------------------------


def _parse_viewbox(svg_el):
    """Return (vb_x, vb_y, vb_w, vb_h) from viewBox attribute."""
    vb = svg_el.get("viewBox")
    if vb:
        parts = re.split(r"[,\s]+", vb.strip())
        return tuple(float(p) for p in parts)
    # Fallback to common pixel dimensions, not EMU scale
    w = float(svg_el.get("width", "1920"))
    h = float(svg_el.get("height", "1080"))
    return (0, 0, w, h)


def _make_scaler(vb_w, vb_h):
    """Return a function that scales SVG coords to EMU."""
    sx = SLIDE_W / vb_w
    sy = SLIDE_H / vb_h

    def scale(val, axis="x"):
        return int(round(float(val) * (sx if axis == "x" else sy)))

    return scale


# ---------------------------------------------------------------------------
# Slide builder
# ---------------------------------------------------------------------------


def _build_slide_xml(shapes_xml):
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        "<p:cSld><p:spTree>"
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        "<p:grpSpPr>"
        '<a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>'
        "</p:grpSpPr>"
        f"{shapes_xml}"
        "</p:spTree></p:cSld>"
        "<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>"
        "</p:sld>"
    )


def convert_svg_to_slide(svg_path, slide, prs):
    """Parse one SVG file and populate a python-pptx slide."""
    tree = etree.parse(str(svg_path))
    svg_el = tree.getroot()

    _, _, vb_w, vb_h = _parse_viewbox(svg_el)
    scale = _make_scaler(vb_w, vb_h)
    gradients = collect_defs(svg_el)

    parts = []
    for child in svg_el:
        xml = convert_element(child, scale, gradients, slide, prs)
        if xml:
            parts.append(xml)

    if not parts:
        log.warning("No shapes converted from %s", svg_path.name)
        return

    full_xml = _build_slide_xml("".join(parts))
    new_sld = parse_xml(full_xml)
    slide._element.getparent().replace(slide._element, new_sld)
    slide._element = new_sld


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def _extract_number(stem):
    m = re.search(r"(\d+)", stem)
    return int(m.group(1)) if m else 0


def svg_dir_to_pptx(svg_dir, output_path):
    """Convert all SVGs in a directory to a PPTX file."""
    svg_dir = Path(svg_dir)
    output_path = Path(output_path)

    svg_files = sorted(svg_dir.glob("*.svg"), key=lambda p: _extract_number(p.stem))
    if not svg_files:
        log.error("No SVG files found in %s", svg_dir)
        sys.exit(1)

    log.info("Found %d SVG file(s) in %s", len(svg_files), svg_dir)

    prs = Presentation()
    prs.slide_width = Emu(SLIDE_W)
    prs.slide_height = Emu(SLIDE_H)
    blank_layout = prs.slide_layouts[6]

    for svg_file in svg_files:
        log.info("Converting %s ...", svg_file.name)
        reset_shape_id()
        slide = prs.slides.add_slide(blank_layout)
        try:
            convert_svg_to_slide(svg_file, slide, prs)
        except Exception as e:
            log.error("Failed to convert %s: %s", svg_file.name, e)
            raise

    prs.save(str(output_path))
    log.info("Saved %s (%d slides)", output_path, len(svg_files))


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 svg_to_pptx.py <svg_dir> <output.pptx>", file=sys.stderr)
        print("", file=sys.stderr)
        print("Convert a directory of SVG files to a native DrawingML PPTX.", file=sys.stderr)
        print("SVG files are sorted numerically (slide1.svg, slide2.svg, ...).", file=sys.stderr)
        sys.exit(1)

    svg_dir = sys.argv[1]
    output = sys.argv[2]

    if not Path(svg_dir).is_dir():
        print(f"Error: {svg_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    svg_dir_to_pptx(svg_dir, output)


if __name__ == "__main__":
    main()
