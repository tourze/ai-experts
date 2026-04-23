# SVG Chart Templates

All templates: `viewBox="0 0 914.4 514.35"`, inline attrs only, `font-family="Inter, Noto Sans SC, Microsoft YaHei, sans-serif"`.

**Palette**: primary `#1B3A5C`, accent `#2196F3`, success `#2D6A4F`, warning `#E76F51`, muted `#94A3B8`, text `#1E293B`, subtext `#64748B`, card `#F1F5F9`, divider `#E2E8F0`.

**Shared rules**: title 24pt bold at y=40 center; safe area x:50-864 y:50-484; no style/class/rgba/mask.

## 1. Bar Chart (Vertical)

Axes at x=120, y-bottom=430. Bars: `<rect x y width height rx="4" fill>`, value label above bar. Grid lines stroke `#E2E8F0` width 0.5. Bar y = 430 - height.

## 2. Bar Chart (Horizontal)

Labels left-aligned at x=200. Bars start x=220, height=30, spacing=70. Value label at x = 220 + width + 10.

## 3. Line Chart

`<polyline points fill="none" stroke stroke-width="3">` + `<circle>` per data point r=5. Legend: colored `<rect>` 16x10 + label.

## 4. Pie/Donut Chart

`<path d="M cx cy L startX startY A r r 0 largeArc 1 endX endY Z">` per segment. Center hole: `<circle cx cy r fill="#FFFFFF">`. Legend right side with colored squares.

Arc coords: x = cx + r*cos(angle), y = cy + r*sin(angle). Center (340, 257), r=140, hole r=70.

## 5. Comparison Table

Header row fill `#1B3A5C` text white. Data rows alternate `#FFFFFF`/`#F8FAFC`, stroke `#E2E8F0`. Row height 50. Left column fill `#F1F5F9` bold.

## 6. Funnel Chart

`<polygon points>` per stage, symmetric narrowing (indent 40pt/layer). Text white centered. Conversion rates on right side. Colors darken top-to-bottom.

## 7. Timeline

Horizontal axis line y=260 stroke-width=3. Nodes alternate above/below: `<circle r=10>` + vertical `<line>` + date (bold) + event text. Arrow endpoint via `<polygon>`.

## 8. Process Flow (3-5 steps)

`<rect width=160 height=140 rx=12>` per step. Step number 32pt, title 14pt bold, desc 14pt. Arrows: `<line>` + `<polygon>` triangle. Last step use success color.

## 9. SWOT Matrix

Four `<rect rx=8>` quadrants: S `#DBEAFE`, W `#FEE2E2`, O `#DCFCE7`, T `#FEF3C7`. Headers colored bold. Items 14pt, line-height 26pt, 3-5 per quadrant.

## 10. KPI Cards (3-4)

`<rect rx=12 fill="#F1F5F9" stroke="#E2E8F0">`. Value 40pt bold primary, label 14pt subtext, trend 14pt bold (green positive, orange negative). 4-card: width=195, spacing=25.

## 11. Icon Grid (2x3)

Card `<rect rx=12>` 230x180. Icon: `<circle r=24>` + centered Unicode/letter 20pt white. Title 15pt bold, desc 14pt subtext. Grid: cols at x=80/340/600, rows at y=80/290.

## 12. Quote Block

Background `#F8FAFC`. Left accent bar `<rect width=6 rx=3>`. Open quote 72pt fill-opacity=0.2. Quote text 22pt (no italic for CJK). Divider line. Author bold 16pt + title 14pt subtext.
