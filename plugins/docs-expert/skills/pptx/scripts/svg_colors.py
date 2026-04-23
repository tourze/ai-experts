"""Color, fill, stroke, and gradient helpers for SVG-to-DrawingML conversion."""

import logging
import math
import re

from lxml import etree

log = logging.getLogger(__name__)

SVG_NS = "http://www.w3.org/2000/svg"

_HEX_RE = re.compile(r"^#([0-9a-fA-F]{3,8})$")
_RGB_RE = re.compile(r"rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)")

_NAMED_COLORS = {
    "white": "FFFFFF", "black": "000000", "red": "FF0000",
    "green": "008000", "blue": "0000FF", "gray": "808080",
    "grey": "808080", "yellow": "FFFF00", "orange": "FFA500",
    "purple": "800080", "maroon": "800000", "navy": "000080",
    "teal": "008080", "aqua": "00FFFF", "fuchsia": "FF00FF",
    "lime": "00FF00", "olive": "808000", "silver": "C0C0C0",
    "coral": "FF7F50", "salmon": "FA8072", "gold": "FFD700",
    "crimson": "DC143C", "tomato": "FF6347", "steelblue": "4682B4",
    "darkgray": "A9A9A9", "darkgrey": "A9A9A9",
    "lightgray": "D3D3D3", "lightgrey": "D3D3D3",
    "darkgreen": "006400", "darkblue": "00008B", "darkred": "8B0000",
    "lightblue": "ADD8E6", "lightgreen": "90EE90",
    "indigo": "4B0082", "violet": "EE82EE", "pink": "FFC0CB",
    "brown": "A52A2A", "beige": "F5F5DC", "ivory": "FFFFF0",
    "khaki": "F0E68C", "cyan": "00FFFF", "magenta": "FF00FF",
    "transparent": None,
}


def parse_color(val):
    """Parse hex/rgb/named color string, return 6-char uppercase hex (no #). None if invalid."""
    if not val or val == "none":
        return None
    val = val.strip()

    m = _HEX_RE.match(val)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = h[0] * 2 + h[1] * 2 + h[2] * 2
        elif len(h) == 4:
            # #RGBA → drop alpha nibble
            h = h[0] * 2 + h[1] * 2 + h[2] * 2
        elif len(h) == 8:
            # #RRGGBBAA → keep RGB, drop alpha (last 2 chars)
            h = h[:6]
        return h.upper()

    rgb_m = _RGB_RE.match(val)
    if rgb_m:
        return f"{int(rgb_m.group(1)):02X}{int(rgb_m.group(2)):02X}{int(rgb_m.group(3)):02X}"

    return _NAMED_COLORS.get(val.lower())


def solid_fill_xml(color_hex):
    return f'<a:solidFill><a:srgbClr val="{color_hex}"/></a:solidFill>'


def no_fill_xml():
    return "<a:noFill/>"


# ---------------------------------------------------------------------------
# Gradients
# ---------------------------------------------------------------------------


def collect_defs(svg_el):
    """Collect gradient definitions from <defs>. Returns {id: (type, element)}."""
    gradients = {}
    for defs in svg_el.iter(f"{{{SVG_NS}}}defs"):
        for lg in defs.iter(f"{{{SVG_NS}}}linearGradient"):
            gid = lg.get("id")
            if gid:
                gradients[gid] = ("linear", lg)
        for rg in defs.iter(f"{{{SVG_NS}}}radialGradient"):
            gid = rg.get("id")
            if gid:
                gradients[gid] = ("radial", rg)
    return gradients


def _gradient_fill_xml(grad_type, grad_el):
    stops = []
    for stop in grad_el.iter(f"{{{SVG_NS}}}stop"):
        raw_offset = stop.get("offset", "0")
        try:
            # DrawingML gradient positions use 0-100000 range
            if raw_offset.endswith("%"):
                frac = float(raw_offset[:-1]) / 100.0
            else:
                frac = float(raw_offset)
            pos = int(frac * 100000)
        except ValueError:
            pos = 0
        color = parse_color(stop.get("stop-color", "#000000")) or "000000"
        opacity = stop.get("stop-opacity")
        alpha_xml = ""
        if opacity:
            try:
                alpha_xml = f'<a:alpha val="{int(float(opacity) * 100000)}"/>'
            except ValueError:
                pass
        stops.append(
            f'<a:gs pos="{pos}"><a:srgbClr val="{color}">{alpha_xml}</a:srgbClr></a:gs>'
        )

    gs_lst = "<a:gsLst>" + "".join(stops) + "</a:gsLst>"

    if grad_type == "linear":
        x1 = float(grad_el.get("x1", "0"))
        y1 = float(grad_el.get("y1", "0"))
        x2 = float(grad_el.get("x2", "1"))
        y2 = float(grad_el.get("y2", "0"))
        angle_deg = math.degrees(math.atan2(y2 - y1, x2 - x1))
        if angle_deg < 0:
            angle_deg += 360
        angle_60k = int(angle_deg * 60000)
        return f'<a:gradFill>{gs_lst}<a:lin ang="{angle_60k}" scaled="1"/></a:gradFill>'
    return f"<a:gradFill>{gs_lst}</a:gradFill>"


# ---------------------------------------------------------------------------
# Public fill / stroke resolvers
# ---------------------------------------------------------------------------


def resolve_fill(el, gradients):
    """Return DrawingML fill XML string for an SVG element."""
    # SVG spec: absent fill defaults to black, not transparent
    fill = el.get("fill", "black").strip()
    if fill == "none":
        return no_fill_xml()

    url_match = re.match(r"url\(#([^)]+)\)", fill)
    if url_match:
        gid = url_match.group(1)
        if gid in gradients:
            return _gradient_fill_xml(*gradients[gid])
        log.warning("Gradient #%s not found in defs", gid)
        return no_fill_xml()

    color = parse_color(fill)
    if color:
        fo = el.get("fill-opacity")
        if fo:
            try:
                alpha = int(float(fo) * 100000)
                return (
                    f'<a:solidFill><a:srgbClr val="{color}">'
                    f'<a:alpha val="{alpha}"/></a:srgbClr></a:solidFill>'
                )
            except ValueError:
                pass
        return solid_fill_xml(color)
    return no_fill_xml()


def resolve_stroke(el):
    """Return <a:ln> XML string for an SVG element's stroke, or empty string."""
    stroke = el.get("stroke", "").strip()
    if not stroke or stroke == "none":
        return ""
    color = parse_color(stroke)
    if not color:
        return ""

    try:
        sw_val = float(el.get("stroke-width", "1"))
    except ValueError:
        sw_val = 1.0

    dash = el.get("stroke-dasharray", "").strip()
    dash_xml = '<a:prstDash val="dash"/>' if dash and dash != "none" else ""

    alpha_xml = ""
    so = el.get("stroke-opacity")
    if so:
        try:
            alpha_xml = f'<a:alpha val="{int(float(so) * 100000)}"/>'
        except ValueError:
            pass

    return (
        f'<a:ln w="{int(sw_val * 12700)}">'
        f'<a:solidFill><a:srgbClr val="{color}">{alpha_xml}</a:srgbClr></a:solidFill>'
        f"{dash_xml}</a:ln>"
    )
