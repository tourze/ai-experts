# SVG Subset for DrawingML Conversion

This document defines the SVG subset that AI models should generate for reliable
conversion to native DrawingML PPTX via `svg_to_pptx.py`.

## Canvas

Use one of two coordinate systems:

| Mode   | viewBox                       | Units | Notes                        |
|--------|-------------------------------|-------|------------------------------|
| EMU    | `0 0 12192000 6858000`        | EMU   | 16:9, matches OOXML natively |
| Points | `0 0 914.4 514.35`            | pt    | 16:9, 1 pt = 12700 EMU      |

Always include `xmlns="http://www.w3.org/2000/svg"` and
`xmlns:xlink="http://www.w3.org/1999/xlink"` (for images).

## Allowed Elements

### Shapes

| SVG Element  | DrawingML Target                           |
|-------------|-------------------------------------------|
| `<rect>`     | `<p:sp>` with `rect` or `roundRect` preset |
| `<circle>`   | `<p:sp>` with `ellipse` preset             |
| `<ellipse>`  | `<p:sp>` with `ellipse` preset             |
| `<line>`     | `<p:cxnSp>` connection shape               |
| `<polyline>` | `<p:sp>` with `<a:custGeom>`               |
| `<polygon>`  | `<p:sp>` with `<a:custGeom>`               |
| `<path>`     | `<p:sp>` with `<a:custGeom>`               |

### Text

| SVG Element | DrawingML Target                   |
|------------|-----------------------------------|
| `<text>`    | `<p:sp>` with `<p:txBody>`         |
| `<tspan>`   | `<a:r>` run within `<a:p>`         |

### Media

| SVG Element | DrawingML Target           |
|------------|---------------------------|
| `<image>`   | `<p:pic>` with embedded image |

### Structure

| SVG Element        | DrawingML Target / Purpose     |
|-------------------|-------------------------------|
| `<svg>`            | Root                          |
| `<g>`              | `<p:grpSp>` group shape       |
| `<defs>`           | Gradient / clip definitions    |
| `<linearGradient>` | `<a:gradFill>` linear          |
| `<radialGradient>` | `<a:gradFill>` radial          |
| `<stop>`           | `<a:gs>` gradient stop         |
| `<clipPath>`       | Clipping via custom geometry   |

## Banned Elements

| Element            | Reason                                      |
|-------------------|---------------------------------------------|
| `<mask>`           | No DrawingML equivalent                     |
| `<style>`          | Use inline presentation attributes instead  |
| `<foreignObject>`  | Cannot convert HTML to DrawingML            |
| `<textPath>`       | No curved-text support in DrawingML         |
| `<animate>`        | Static slides only                          |
| `<script>`         | Security risk, no runtime in PPTX           |
| `<symbol>`         | Inline the content directly                 |
| `<use>`            | Inline the referenced element               |
| `<filter>`         | Drop shadows/blurs have no reliable mapping |
| `<pattern>`        | Use solid or gradient fills                 |
| `<marker>`         | Draw arrowheads as explicit paths           |

## Attribute Constraints

### Banned attributes

- `class` -- use inline presentation attributes (`fill`, `stroke`, etc.)
- `style` -- same reason; every property must be a direct attribute

### Color

- No `rgba()` -- use `fill-opacity` / `stroke-opacity` as separate attributes
- Hex colors only: `#RRGGBB` or `#RGB`
- No `currentColor`, no CSS color names

### Opacity

- No `opacity` on `<g>` elements -- set `fill-opacity` and `stroke-opacity`
  on each child individually
- Leaf elements may use `opacity` if needed

### Coordinates

- All coordinates must be absolute (no relative `d` commands preferred;
  the converter normalizes them but absolute is safer)
- `transform` supports: `translate(x,y)`, `scale(sx,sy)`, `rotate(deg,cx,cy)`
- No `matrix()` transforms -- decompose into translate/scale/rotate

### Images

- `xlink:href` must use `data:image/png;base64,...` or `data:image/jpeg;base64,...`
- No external URL references

## CJK Typography Rules

### Font chain

Always specify the full fallback chain:

```
font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
```

### Width estimation

CJK characters are approximately 1.8x the width of Latin characters at the
same font size. When estimating text box width:

```
effective_chars = latin_count + (cjk_count * 1.8)
```

### Line height

Add +20% line height compared to Latin-only text:

```
Latin: font-size * 1.2
CJK:   font-size * 1.44
```

### Emphasis

- Use `font-weight="bold"` for CJK emphasis
- Never use `font-style="italic"` for CJK text (most CJK fonts lack italic)

### Line-break rules (kinsoku)

No break **before** these punctuation marks:
```
，。、；：！？）」』】〉》
```

No break **after** these punctuation marks:
```
（「『【〈《
```

## Example: Title + Subtitle + Cards

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 12192000 6858000">

  <!-- Background -->
  <rect x="0" y="0" width="12192000" height="6858000" fill="#FFFFFF"/>

  <!-- Title -->
  <text x="6096000" y="1200000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="440000" font-weight="bold"
        fill="#1A1A2E" text-anchor="middle">
    Quarterly Business Review
  </text>

  <!-- Subtitle -->
  <text x="6096000" y="1750000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="240000"
        fill="#666666" text-anchor="middle">
    Q4 2025 Performance Summary
  </text>

  <!-- Divider line -->
  <line x1="4096000" y1="2100000" x2="8096000" y2="2100000"
        stroke="#E0E0E0" stroke-width="20000"/>

  <!-- Card 1 -->
  <rect x="800000" y="2800000" width="3200000" height="3200000"
        rx="120000" ry="120000" fill="#F8F9FA" stroke="#E0E0E0" stroke-width="10000"/>
  <text x="2400000" y="3600000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="560000" font-weight="bold"
        fill="#2D6A4F" text-anchor="middle">
    $4.2M
  </text>
  <text x="2400000" y="4200000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="200000"
        fill="#666666" text-anchor="middle">
    Revenue
  </text>

  <!-- Card 2 -->
  <rect x="4496000" y="2800000" width="3200000" height="3200000"
        rx="120000" ry="120000" fill="#F8F9FA" stroke="#E0E0E0" stroke-width="10000"/>
  <text x="6096000" y="3600000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="560000" font-weight="bold"
        fill="#1A759F" text-anchor="middle">
    1,247
  </text>
  <text x="6096000" y="4200000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="200000"
        fill="#666666" text-anchor="middle">
    New Customers
  </text>

  <!-- Card 3 -->
  <rect x="8192000" y="2800000" width="3200000" height="3200000"
        rx="120000" ry="120000" fill="#F8F9FA" stroke="#E0E0E0" stroke-width="10000"/>
  <text x="9792000" y="3600000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="560000" font-weight="bold"
        fill="#E76F51" text-anchor="middle">
    94.2%
  </text>
  <text x="9792000" y="4200000"
        font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"
        font-size="200000"
        fill="#666666" text-anchor="middle">
    Retention Rate
  </text>
</svg>
```

This example demonstrates:
- EMU coordinate system (viewBox matches 16:9 slide dimensions)
- Full CJK font fallback chain on every text element
- Inline presentation attributes only (no `class` or `style`)
- Hex colors (no `rgba()`)
- Rounded rectangles via `rx`/`ry`
- All elements within the allowed subset
