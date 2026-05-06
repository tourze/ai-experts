#!/usr/bin/env node
/**
 * katex_render.mjs — Server-side KaTeX rendering for HTML files.
 *
 * Finds <span class="math inline">LATEX</span> and <span class="math display">LATEX</span>
 * elements produced by pandoc's --katex flag, and replaces them with KaTeX-rendered HTML.
 *
 * Usage: node katex_render.mjs <input.html> <output.html>
 *
 * This produces HTML that displays math without any client-side JavaScript,
 * requiring only the KaTeX CSS + fonts for proper rendering.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

if (process.argv.length < 4) {
  console.error("Usage: node katex_render.mjs <input.html> <output.html>");
  process.exit(1);
}

let katex;
try {
  katex = require("katex");
} catch (error) {
  const npmRoot = spawnSync("npm", ["root", "-g"], { encoding: "utf8" }).stdout.trim();
  if (npmRoot) {
    try {
      katex = require(path.join(npmRoot, "katex"));
    } catch {
      // Report the normal install guidance below.
    }
  }
  if (!katex) {
    console.error("KaTeX is not installed. Run `node scripts/setup.mjs` or `npm install -g katex`.");
    process.exit(1);
  }
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

let html = fs.readFileSync(inputPath, "utf8");
let inlineCount = 0;
let displayCount = 0;
let errorCount = 0;

// Decode HTML entities that pandoc may have inserted
function decodeEntities(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Replace inline math: <span class="math inline">LATEX</span>
html = html.replace(
  /<span class="math inline">([\s\S]*?)<\/span>/g,
  (match, latex) => {
    try {
      const decoded = decodeEntities(latex.trim());
      inlineCount++;
      return katex.renderToString(decoded, {
        displayMode: false,
        throwOnError: false,
        output: "html",
        strict: false,
      });
    } catch (e) {
      errorCount++;
      console.error(
        `  Inline math error: ${e.message} | Source: ${latex.substring(0, 60)}`,
      );
      return match;
    }
  },
);

// Replace display math: <span class="math display">LATEX</span>
// pandoc may wrap these in <p> tags or use newlines
html = html.replace(
  /<span[^>]*class="math display"[^>]*>([\s\S]*?)<\/span>/g,
  (match, latex) => {
    try {
      const decoded = decodeEntities(latex.trim());
      displayCount++;
      return katex.renderToString(decoded, {
        displayMode: true,
        throwOnError: false,
        output: "html",
        strict: false,
      });
    } catch (e) {
      errorCount++;
      console.error(
        `  Display math error: ${e.message} | Source: ${latex.substring(0, 60)}`,
      );
      return match;
    }
  },
);

fs.writeFileSync(outputPath, html, "utf8");

const stats = {
  inline: inlineCount,
  display: displayCount,
  errors: errorCount,
};
// Output stats as JSON on the last line for parsing by md_to_pdf.mjs.
console.log(JSON.stringify(stats));
