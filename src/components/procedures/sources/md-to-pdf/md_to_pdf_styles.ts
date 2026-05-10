export const DEFAULT_CSS = `
/* === MD-TO-PDF: Professional Document Styles === */

@page {
    size: {page_format};
    margin: {margin_top} {margin_right} {margin_bottom} {margin_left};
}

body {
    font-family: 'Georgia', 'Times New Roman', 'DejaVu Serif', serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a1a1a;
    max-width: none;
    padding: 0;
    margin: 0;
}

h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #111;
    border-bottom: 2.5px solid #333;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 0.6em;
}
h2 {
    font-size: 16pt;
    font-weight: 600;
    color: #1a1a1a;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
    margin-top: 1.6em;
    margin-bottom: 0.5em;
}
h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #2a2a2a;
    margin-top: 1.3em;
    margin-bottom: 0.4em;
}
h4, h5, h6 {
    font-size: 11pt;
    font-weight: 600;
    color: #333;
    margin-top: 1em;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 10pt;
    page-break-inside: avoid;
}
thead th {
    background-color: #f0f0f0;
    font-weight: 700;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #bbb;
    border-bottom: 2px solid #999;
}
td {
    padding: 6px 12px;
    border: 1px solid #ddd;
    vertical-align: top;
}
tbody tr:nth-child(even) {
    background-color: #fafafa;
}

code {
    font-family: 'Courier New', 'DejaVu Sans Mono', monospace;
    font-size: 9.5pt;
    background: #f5f5f5;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e8e8e8;
}
pre {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 14px 16px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.45;
    page-break-inside: avoid;
    margin: 1em 0;
}
pre code {
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
}

.mermaid-diagram {
    text-align: center;
    margin: 1.5em auto;
    page-break-inside: avoid;
}
.mermaid-diagram svg {
    max-width: 100%;
    height: auto;
}

.katex-display {
    margin: 1em 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.25em 0;
}
.katex {
    font-size: 1.1em;
}

ul, ol {
    padding-left: 1.8em;
    margin: 0.5em 0;
}
li {
    margin-bottom: 0.25em;
}
li > p {
    margin: 0.25em 0;
}

blockquote {
    border-left: 3px solid #999;
    margin: 1em 0;
    padding: 0.5em 0 0.5em 1.2em;
    color: #444;
    background: #fcfcfc;
}
blockquote p {
    margin: 0.3em 0;
}

hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 2em 0;
}

a {
    color: #1a5276;
    text-decoration: none;
}

img {
    max-width: 100%;
    height: auto;
}

dt { font-weight: bold; margin-top: 0.5em; }
dd { margin-left: 1.5em; margin-bottom: 0.5em; }

.footnotes { font-size: 9pt; border-top: 1px solid #ccc; margin-top: 2em; padding-top: 0.5em; }
.footnote-ref { font-size: 8pt; vertical-align: super; }

.page-break { page-break-before: always; }
`;
export const HEADER_FOOTER_CSS = `
@page {
    @bottom-center {
        content: counter(page);
        font-size: 9pt;
        color: #888;
        font-family: 'Helvetica Neue', Arial, sans-serif;
    }
}
`;
