"""SVG element to DrawingML shape converters."""

import base64
import logging
import re
from io import BytesIO

from lxml import etree

from svg_colors import parse_color, resolve_fill, resolve_stroke
from svg_paths import path_to_drawingml

log = logging.getLogger(__name__)

SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"

SLIDE_W = 12192000
SLIDE_H = 6858000

BANNED_ELEMENTS = {
    "mask", "style", "foreignObject", "textPath", "animate",
    "script", "symbol", "use", "filter", "pattern", "marker",
    "animateTransform", "animateMotion", "set",
}

_TRANSFORM_RE = re.compile(r"(translate|scale|rotate)\s*\(([^)]+)\)")

# Auto-incrementing shape ID
_shape_id = [1]


def reset_shape_id():
    _shape_id[0] = 1


def _next_id():
    _shape_id[0] += 1
    return _shape_id[0]


def _xml_escape(text):
    return (
        text.replace("&", "&amp;").replace("<", "&lt;")
        .replace(">", "&gt;").replace('"', "&quot;")
    )


def _parse_transform(val):
    """Parse SVG transform -> (tx, ty, sx, sy, rot_deg)."""
    tx, ty, sx, sy, rot = 0.0, 0.0, 1.0, 1.0, 0.0
    if not val:
        return tx, ty, sx, sy, rot
    for func, args_str in _TRANSFORM_RE.findall(val):
        args = [float(a) for a in re.split(r"[,\s]+", args_str.strip())]
        if func == "translate":
            tx += args[0]
            ty += args[1] if len(args) > 1 else 0
        elif func == "scale":
            sx *= args[0]
            sy *= args[1] if len(args) > 1 else args[0]
        elif func == "rotate":
            rot += args[0]
    return tx, ty, sx, sy, rot


# ---------------------------------------------------------------------------
# Shape converters
# ---------------------------------------------------------------------------


def _apply_transform(el, x, y):
    """Apply element-level translate transform to coordinates."""
    tx, ty, _, _, _ = _parse_transform(el.get("transform"))
    return x + tx, y + ty


def _rect(el, scale, gradients):
    tx, ty = _apply_transform(el, float(el.get("x", "0")), float(el.get("y", "0")))
    x = scale(tx, "x")
    y = scale(ty, "y")
    w = scale(el.get("width", "0"), "x")
    h = scale(el.get("height", "0"), "y")
    rx_attr, ry_attr = el.get("rx"), el.get("ry")

    prst = "rect"
    adj = "<a:avLst/>"
    if rx_attr or ry_attr:
        prst = "roundRect"
        r = float(rx_attr or ry_attr or "0")
        min_dim = min(float(el.get("width", "1")), float(el.get("height", "1")))
        adj_val = int(r / min_dim * 50000) if min_dim > 0 else 0
        adj = f'<a:avLst><a:gd name="adj" fmla="val {adj_val}"/></a:avLst>'

    sid = _next_id()
    fill = resolve_fill(el, gradients)
    stroke = resolve_stroke(el)

    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Rect{sid}"/>'
        f"<p:cNvSpPr/><p:nvPr/></p:nvSpPr>"
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:prstGeom prst="{prst}">{adj}</a:prstGeom>'
        f"{fill}{stroke}</p:spPr></p:sp>"
    )


def _ellipse(el, scale, gradients):
    tag = etree.QName(el).localname
    if tag == "circle":
        ccx, ccy = float(el.get("cx", "0")), float(el.get("cy", "0"))
        ccx, ccy = _apply_transform(el, ccx, ccy)
        r = float(el.get("r", "0"))
        sx, sy, w, h = ccx - r, ccy - r, r * 2, r * 2
    else:
        ccx, ccy = float(el.get("cx", "0")), float(el.get("cy", "0"))
        ccx, ccy = _apply_transform(el, ccx, ccy)
        rx, ry = float(el.get("rx", "0")), float(el.get("ry", "0"))
        sx, sy, w, h = ccx - rx, ccy - ry, rx * 2, ry * 2

    sid = _next_id()
    fill = resolve_fill(el, gradients)
    stroke = resolve_stroke(el)

    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Ellipse{sid}"/>'
        f"<p:cNvSpPr/><p:nvPr/></p:nvSpPr>"
        f'<p:spPr><a:xfrm><a:off x="{scale(sx,"x")}" y="{scale(sy,"y")}"/>'
        f'<a:ext cx="{scale(w,"x")}" cy="{scale(h,"y")}"/></a:xfrm>'
        f'<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>'
        f"{fill}{stroke}</p:spPr></p:sp>"
    )


def _line(el, scale, gradients):
    x1 = scale(el.get("x1", "0"), "x")
    y1 = scale(el.get("y1", "0"), "y")
    x2 = scale(el.get("x2", "0"), "x")
    y2 = scale(el.get("y2", "0"), "y")

    off_x, off_y = min(x1, x2), min(y1, y2)
    cx, cy = abs(x2 - x1) or 1, abs(y2 - y1) or 1

    sid = _next_id()
    stroke = resolve_stroke(el)
    if not stroke:
        stroke = '<a:ln w="12700"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln>'

    flip_h = ' flipH="1"' if x2 < x1 else ""
    flip_v = ' flipV="1"' if y2 < y1 else ""

    return (
        f'<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{sid}" name="Line{sid}"/>'
        f"<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>"
        f'<p:spPr><a:xfrm{flip_h}{flip_v}><a:off x="{off_x}" y="{off_y}"/>'
        f'<a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>'
        f"{stroke}</p:spPr></p:cxnSp>"
    )


def _path(el, scale, gradients):
    d = el.get("d", "").strip()
    if not d:
        return ""
    result = path_to_drawingml(d, scale)
    if not result:
        return ""
    path_xml, w, h, ox, oy = result
    sid = _next_id()
    fill = resolve_fill(el, gradients)
    stroke = resolve_stroke(el)
    w, h = max(w, 1), max(h, 1)

    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Path{sid}"/>'
        f"<p:cNvSpPr/><p:nvPr/></p:nvSpPr>"
        f'<p:spPr><a:xfrm><a:off x="{ox}" y="{oy}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/>'
        f'<a:pathLst><a:path w="{w}" h="{h}">{path_xml}</a:path></a:pathLst></a:custGeom>'
        f"{fill}{stroke}</p:spPr></p:sp>"
    )


def _polyline(el, scale, gradients, closed=False):
    points_str = el.get("points", "").strip()
    if not points_str:
        return ""
    coords = re.findall(r"[-+]?(?:\d+\.?\d*|\.\d+)", points_str)
    if len(coords) < 4:
        return ""

    pairs = [(float(coords[i]), float(coords[i + 1])) for i in range(0, len(coords) - 1, 2)]
    min_x = min(p[0] for p in pairs)
    min_y = min(p[1] for p in pairs)
    max_x = max(p[0] for p in pairs)
    max_y = max(p[1] for p in pairs)

    w_emu = scale(max_x - min_x, "x") or 1
    h_emu = scale(max_y - min_y, "y") or 1

    parts = []
    for i, (px, py) in enumerate(pairs):
        ex, ey = scale(px - min_x, "x"), scale(py - min_y, "y")
        tag = "a:moveTo" if i == 0 else "a:lnTo"
        parts.append(f'<{tag}><a:pt x="{ex}" y="{ey}"/></{tag}>')
    if closed:
        parts.append("<a:close/>")

    sid = _next_id()
    fill = resolve_fill(el, gradients)
    stroke = resolve_stroke(el)

    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Poly{sid}"/>'
        f"<p:cNvSpPr/><p:nvPr/></p:nvSpPr>"
        f'<p:spPr><a:xfrm><a:off x="{scale(min_x,"x")}" y="{scale(min_y,"y")}"/>'
        f'<a:ext cx="{w_emu}" cy="{h_emu}"/></a:xfrm>'
        f'<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/>'
        f'<a:pathLst><a:path w="{w_emu}" h="{h_emu}">{"".join(parts)}</a:path></a:pathLst>'
        f"</a:custGeom>{fill}{stroke}</p:spPr></p:sp>"
    )


def _text(el, scale, gradients):
    x, y = _apply_transform(el, float(el.get("x", "0")), float(el.get("y", "0")))
    font_family = el.get("font-family", "Calibri")
    font_size_raw = el.get("font-size", "180000")
    font_weight = el.get("font-weight", "")
    fill_color = parse_color(el.get("fill", "#000000")) or "000000"
    anchor = el.get("text-anchor", "start")

    try:
        fs = float(re.sub(r"[^\d.]", "", font_size_raw))
    except ValueError:
        fs = 1400
    # EMU-scale font size -> DrawingML hundredths-of-a-point
    sz = int(fs / 12700 * 100) if fs > 10000 else int(fs * 100)

    bold = ' b="1"' if font_weight in ("bold", "700", "800", "900") else ""
    algn = {"start": "l", "middle": "ctr", "end": "r"}.get(anchor, "l")
    typeface = font_family.replace('"', "").replace("'", "").split(",")[0].strip()

    # Collect runs from tspan children or direct text
    runs = []
    tspans = list(el.iter(f"{{{SVG_NS}}}tspan"))
    if tspans:
        for ts in tspans:
            txt = (ts.text or "").strip()
            if not txt:
                continue
            tw = ts.get("font-weight", font_weight)
            tb = ' b="1"' if tw in ("bold", "700", "800", "900") else bold
            tc = parse_color(ts.get("fill", "")) or fill_color
            tsz = sz
            tsr = ts.get("font-size", "")
            if tsr:
                try:
                    tfs = float(re.sub(r"[^\d.]", "", tsr))
                    tsz = int(tfs / 12700 * 100) if tfs > 10000 else int(tfs * 100)
                except ValueError:
                    pass
            runs.append(_run_xml(txt, tsz, tb, tc, typeface))
    else:
        txt = (el.text or "").strip()
        if txt:
            runs.append(_run_xml(txt, sz, bold, fill_color, typeface))

    if not runs:
        return ""

    # Estimate box size
    char_count = sum(len(t) for t in [el.text or ""] + [t.text or "" for t in tspans])
    est_w = max(scale(char_count * fs * 0.6, "x"), scale(fs * 2, "x"))
    est_h = scale(fs * 1.5, "y")

    x_emu = scale(x, "x")
    y_emu = max(0, scale(y, "y") - int(est_h * 0.7))
    if anchor == "middle":
        x_emu = max(0, x_emu - est_w // 2)
    elif anchor == "end":
        x_emu = max(0, x_emu - est_w)

    sid = _next_id()
    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Text{sid}"/>'
        f'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x_emu}" y="{y_emu}"/>'
        f'<a:ext cx="{est_w}" cy="{est_h}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
        f'<p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="t"/><a:lstStyle/>'
        f'<a:p><a:pPr algn="{algn}"/>{"".join(runs)}</a:p></p:txBody></p:sp>'
    )


def _run_xml(text, sz, bold, color, typeface):
    return (
        f'<a:r><a:rPr lang="en-US" sz="{sz}"{bold} dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{typeface}"/><a:ea typeface="{typeface}"/>'
        f'<a:cs typeface="{typeface}"/>'
        f"</a:rPr><a:t>{_xml_escape(text)}</a:t></a:r>"
    )


class _ImageFile:
    """File-like wrapper for python-pptx image embedding using BytesIO."""
    def __init__(self, data, ext):
        self._buf = BytesIO(data)
        self.content_type = f"image/{'jpeg' if ext in ('jpg','jpeg') else ext}"
        self._blob = data

    @property
    def blob(self):
        return self._blob

    def read(self):
        return self._buf.read()

    def seek(self, pos):
        self._buf.seek(pos)


def _image(el, scale, gradients, slide, prs):
    href = el.get(f"{{{XLINK_NS}}}href") or el.get("href", "")
    if not href:
        return ""

    x = scale(el.get("x", "0"), "x")
    y = scale(el.get("y", "0"), "y")
    w = scale(el.get("width", "0"), "x")
    h = scale(el.get("height", "0"), "y")

    m = re.match(r"data:image/(png|jpeg|jpg|gif|bmp);base64,(.*)", href, re.DOTALL)
    if not m:
        log.warning("External image URL skipped (must be base64 data URI)")
        return ""

    ext = "png" if m.group(1) == "png" else "jpeg"
    img_data = base64.b64decode(m.group(2))
    _, r_id = slide.part.get_or_add_image_part(_ImageFile(img_data, ext))

    sid = _next_id()
    return (
        f'<p:pic><p:nvPicPr><p:cNvPr id="{sid}" name="Image{sid}"/>'
        f'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
        f"<p:nvPr/></p:nvPicPr>"
        f'<p:blipFill><a:blip r:embed="{r_id}"/>'
        f"<a:stretch><a:fillRect/></a:stretch></p:blipFill>"
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'
    )


def _group(el, scale, gradients, slide, prs):
    children = []
    for child in el:
        xml = convert_element(child, scale, gradients, slide, prs)
        if xml:
            children.append(xml)
    if not children:
        return ""

    tx, ty, _, _, _ = _parse_transform(el.get("transform"))
    ox, oy = scale(tx, "x"), scale(ty, "y")
    sid = _next_id()

    return (
        f'<p:grpSp><p:nvGrpSpPr><p:cNvPr id="{sid}" name="Group{sid}"/>'
        f"<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>"
        f'<p:grpSpPr><a:xfrm><a:off x="{ox}" y="{oy}"/>'
        f'<a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/>'
        f'<a:chOff x="{ox}" y="{oy}"/><a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/>'
        f"</a:xfrm></p:grpSpPr>"
        f"{''.join(children)}</p:grpSp>"
    )


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

_SKIP_TAGS = {
    "defs", "title", "desc", "metadata", "svg",
    "linearGradient", "radialGradient", "stop", "clipPath",
}


_DISPATCH = {
    "rect": _rect,
    "circle": _ellipse, "ellipse": _ellipse,
    "line": _line,
    "path": _path,
    "polyline": lambda e, s, g: _polyline(e, s, g),
    "polygon": lambda e, s, g: _polyline(e, s, g, closed=True),
    "text": _text,
}


def convert_element(el, scale, gradients, slide, prs):
    """Convert one SVG element to DrawingML XML string."""
    tag = etree.QName(el).localname

    if tag in BANNED_ELEMENTS:
        log.warning("Skipping banned element: <%s>", tag)
        return ""
    if tag in _SKIP_TAGS:
        return ""

    if tag in _DISPATCH:
        return _DISPATCH[tag](el, scale, gradients)
    if tag == "image":
        return _image(el, scale, gradients, slide, prs)
    if tag == "g":
        return _group(el, scale, gradients, slide, prs)

    log.warning("Unsupported element: <%s>, skipping", tag)
    return ""
