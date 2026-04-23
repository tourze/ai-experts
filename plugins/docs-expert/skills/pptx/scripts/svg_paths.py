"""SVG path d-attribute parser and DrawingML path converter."""

import logging
import re

log = logging.getLogger(__name__)


def _chunk(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def _tokenize(d):
    """Tokenize SVG path d attribute into (command, [args]) pairs."""
    tokens = re.findall(
        r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?", d
    )
    commands = []
    cmd = None
    args = []
    for t in tokens:
        if t.isalpha():
            if cmd is not None:
                commands.append((cmd, args))
            cmd = t
            args = []
        else:
            args.append(float(t))
    if cmd is not None:
        commands.append((cmd, args))
    return commands


def path_to_drawingml(d_attr, scale):
    """Convert SVG path d to DrawingML path XML.

    Args:
        d_attr: SVG path d attribute string.
        scale: Callable(value, axis) -> EMU integer.

    Returns:
        (path_xml, width_emu, height_emu, offset_x_emu, offset_y_emu)
        or None if the path is empty.
    """
    commands = _tokenize(d_attr)
    if not commands:
        return None

    # Normalize to absolute and collect bounding box
    abs_cmds = []
    cx, cy = 0.0, 0.0
    # Track last control point for S/T smooth commands
    prev_x2, prev_y2 = 0.0, 0.0
    prev_qx, prev_qy = 0.0, 0.0
    last_cmd = ""
    min_x = min_y = float("inf")
    max_x = max_y = float("-inf")

    def _b(x, y):
        nonlocal min_x, min_y, max_x, max_y
        if x < min_x: min_x = x
        if x > max_x: max_x = x
        if y < min_y: min_y = y
        if y > max_y: max_y = y

    for cmd, args in commands:
        upper = cmd.upper()
        rel = cmd.islower()

        if upper == "Z":
            abs_cmds.append(("Z", []))

        elif upper == "M":
            for j, (x, y) in enumerate(_chunk(args, 2)):
                ax, ay = (cx + x, cy + y) if rel else (x, y)
                _b(ax, ay)
                abs_cmds.append(("M" if j == 0 else "L", [ax, ay]))
                cx, cy = ax, ay

        elif upper == "L":
            for x, y in _chunk(args, 2):
                ax, ay = (cx + x, cy + y) if rel else (x, y)
                _b(ax, ay)
                abs_cmds.append(("L", [ax, ay]))
                cx, cy = ax, ay

        elif upper == "H":
            for x in args:
                ax = cx + x if rel else x
                _b(ax, cy)
                abs_cmds.append(("L", [ax, cy]))
                cx = ax

        elif upper == "V":
            for y in args:
                ay = cy + y if rel else y
                _b(cx, ay)
                abs_cmds.append(("L", [cx, ay]))
                cy = ay

        elif upper == "C":
            for x1, y1, x2, y2, x, y in _chunk(args, 6):
                if rel:
                    x1, y1 = cx + x1, cy + y1
                    x2, y2 = cx + x2, cy + y2
                    x, y = cx + x, cy + y
                for px, py in [(x1, y1), (x2, y2), (x, y)]:
                    _b(px, py)
                abs_cmds.append(("C", [x1, y1, x2, y2, x, y]))
                prev_x2, prev_y2 = x2, y2
                cx, cy = x, y
                last_cmd = "C"

        elif upper == "S":
            for x2, y2, x, y in _chunk(args, 4):
                if rel:
                    x2, y2 = cx + x2, cy + y2
                    x, y = cx + x, cy + y
                # Reflect previous C/S control point through current point
                if last_cmd in ("C", "S"):
                    x1 = 2 * cx - prev_x2
                    y1 = 2 * cy - prev_y2
                else:
                    x1, y1 = cx, cy
                for px, py in [(x1, y1), (x2, y2), (x, y)]:
                    _b(px, py)
                abs_cmds.append(("C", [x1, y1, x2, y2, x, y]))
                prev_x2, prev_y2 = x2, y2
                cx, cy = x, y
                last_cmd = "S"

        elif upper == "Q":
            for qx1, qy1, x, y in _chunk(args, 4):
                if rel:
                    qx1, qy1 = cx + qx1, cy + qy1
                    x, y = cx + x, cy + y
                # Quadratic -> cubic control points
                cx1 = cx + 2 / 3 * (qx1 - cx)
                cy1 = cy + 2 / 3 * (qy1 - cy)
                cx2 = x + 2 / 3 * (qx1 - x)
                cy2 = y + 2 / 3 * (qy1 - y)
                for px, py in [(cx1, cy1), (cx2, cy2), (x, y)]:
                    _b(px, py)
                abs_cmds.append(("C", [cx1, cy1, cx2, cy2, x, y]))
                prev_qx, prev_qy = qx1, qy1
                cx, cy = x, y
                last_cmd = "Q"

        elif upper == "T":
            for x, y in _chunk(args, 2):
                if rel:
                    x, y = cx + x, cy + y
                # Reflect previous Q/T control point
                if last_cmd in ("Q", "T"):
                    qx1 = 2 * cx - prev_qx
                    qy1 = 2 * cy - prev_qy
                else:
                    qx1, qy1 = cx, cy
                cx1 = cx + 2 / 3 * (qx1 - cx)
                cy1 = cy + 2 / 3 * (qy1 - cy)
                cx2 = x + 2 / 3 * (qx1 - x)
                cy2 = y + 2 / 3 * (qy1 - y)
                for px, py in [(cx1, cy1), (cx2, cy2), (x, y)]:
                    _b(px, py)
                abs_cmds.append(("C", [cx1, cy1, cx2, cy2, x, y]))
                prev_qx, prev_qy = qx1, qy1
                cx, cy = x, y
                last_cmd = "T"

        elif upper == "A":
            for chunk in _chunk(args, 7):
                x, y = chunk[5], chunk[6]
                if rel:
                    x, y = cx + x, cy + y
                _b(x, y)
                abs_cmds.append(("L", [x, y]))
                cx, cy = x, y
                log.warning("Arc command approximated as line segment")

        else:
            log.warning("Unsupported path command: %s", cmd)

    if min_x == float("inf"):
        return None

    # Build DrawingML path XML (offset to local origin)
    parts = []
    for cmd, a in abs_cmds:
        if cmd == "M":
            parts.append(
                f'<a:moveTo><a:pt x="{scale(a[0]-min_x,"x")}" y="{scale(a[1]-min_y,"y")}"/></a:moveTo>'
            )
        elif cmd == "L":
            parts.append(
                f'<a:lnTo><a:pt x="{scale(a[0]-min_x,"x")}" y="{scale(a[1]-min_y,"y")}"/></a:lnTo>'
            )
        elif cmd == "C":
            pts = "".join(
                f'<a:pt x="{scale(a[j]-min_x,"x")}" y="{scale(a[j+1]-min_y,"y")}"/>'
                for j in range(0, 6, 2)
            )
            parts.append(f"<a:cubicBezTo>{pts}</a:cubicBezTo>")
        elif cmd == "Z":
            parts.append("<a:close/>")

    w = scale(max_x - min_x, "x")
    h = scale(max_y - min_y, "y")
    return "".join(parts), w, h, scale(min_x, "x"), scale(min_y, "y")
