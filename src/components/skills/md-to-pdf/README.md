# md-to-pdf

A local AI skill that converts Markdown files to professionally styled PDF documents with full support for **Mermaid diagrams**, **LaTeX math (KaTeX)**, **tables**, **syntax-highlighted code blocks**, and all standard Markdown features.

## Quick Start

```bash
# 1. Check dependencies
node <runtime-root>/procedures.js --procedure-id md-to-pdf-setup --trigger-skill md-to-pdf

# 2. Convert
node <runtime-root>/procedures.js --procedure-id md-to-pdf-md-to-pdf --trigger-skill md-to-pdf -- input.md output.pdf

# 3. With options
node <runtime-root>/procedures.js --procedure-id md-to-pdf-md-to-pdf --trigger-skill md-to-pdf -- input.md output.pdf --format Letter --header-footer --landscape
```

## Runtime Layout

The generated skill directory is installed under the active agent skill root:

```text
<skills-dir>/md-to-pdf/
├── SKILL.md
├── LICENSE.txt
├── README.md
└── references/
    ├── index.md
    └── test-document.md
```

Executable entrypoints are bundled in the platform-level `procedures.js`; use the procedure commands shown in `SKILL.md`.

## Rendering Pipeline

```text
Markdown → [mmdc: Mermaid→SVG] → [pandoc: MD→HTML] → [KaTeX: LaTeX→HTML] → [Playwright: HTML→PDF]
```

Each stage is independently skippable (`--no-mermaid`, `--no-math`) for speed when features aren't needed.

## Dependencies

| Tool       | Purpose       | Install                                                 |
| ---------- | ------------- | ------------------------------------------------------- |
| pandoc     | MD → HTML     | `apt install pandoc`                                    |
| mmdc       | Mermaid → SVG | `npm install -g @mermaid-js/mermaid-cli`                |
| katex      | LaTeX → HTML  | `npm install -g katex`                                  |
| playwright | HTML → PDF    | `npm install -g playwright && playwright install chromium` |

Do not assume these tools are pre-installed. Run the `md-to-pdf-setup` procedure before conversion and treat its output as the source of truth for the current machine.

## Options

| Flag              | Default | Description                             |
| ----------------- | ------- | --------------------------------------- |
| `--format`        | A4      | A4 / Letter / Legal / A3                |
| `--margin`        | 0.75in  | Single value or `top,right,bottom,left` |
| `--landscape`     | off     | Landscape orientation                   |
| `--header-footer` | off     | Page numbers in footer                  |
| `--css`           | none    | Custom CSS file to layer on top         |
| `--no-mermaid`    | off     | Skip Mermaid rendering                  |
| `--no-math`       | off     | Skip KaTeX rendering                    |

## Customization

**Custom CSS**: `--css custom.css` injects after defaults (your rules win).

**Mermaid theming**: set `MERMAID_CONFIG=/path/to/.mermaidrc` before running the `md-to-pdf-md-to-pdf` procedure.

## Testing

```bash
node <runtime-root>/procedures.js --procedure-id md-to-pdf-md-to-pdf --trigger-skill md-to-pdf -- references/test-document.md test_output.pdf --header-footer
```

The test document exercises all supported features: 4 Mermaid diagram types, inline + display math, tables, code blocks in 3 languages, footnotes, definition lists, blockquotes, and text formatting.

## License

MIT — see [LICENSE.txt](LICENSE.txt).
