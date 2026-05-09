#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
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
import fs, { realpathSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "md-to-pdf-katex-render",
  entry: procedureEntry(import.meta.url),
  description:
    "服务端 KaTeX 数学公式渲染：将 HTML 中 pandoc 生成的 <span class='math'>LaTeX 替换为 KaTeX 渲染后的 HTML。",
  owners: { skillIds: ["md-to-pdf"] },
  target: "scripts/katex_render.mjs",
  runtime: "node",

  exampleArgs: { args: ["input.html", "output.html"] },
});

const require = createRequire(import.meta.url);
type KatexRenderer = {
  renderToString(source: string, options: Record<string, any>): string;
};
type KatexStats = {
  inline: number;
  display: number;
  errors: number;
};
function loadKatex(): KatexRenderer {
  let katex: KatexRenderer | null = null;
  try {
    katex = require("katex") as KatexRenderer;
  } catch {
    const npmRoot = spawnSync("npm", ["root", "-g"], {
      encoding: "utf8",
    }).stdout.trim();
    if (npmRoot) {
      try {
        katex = require(path.join(npmRoot, "katex")) as KatexRenderer;
      } catch {
        // Report the normal install guidance below.
      }
    }
  }
  if (!katex) {
    throw new Error(
      "KaTeX is not installed. Run `node scripts/setup.mjs` or `npm install -g katex`.",
    );
  }
  return katex;
}
// Decode HTML entities that pandoc may have inserted
function decodeEntities(str: any): any {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
export function renderKatexFile(
  inputPath: string,
  outputPath: string,
): KatexStats {
  const katex = loadKatex();
  let html = fs.readFileSync(inputPath, "utf8");
  let inlineCount = 0;
  let displayCount = 0;
  let errorCount = 0;
  // Replace inline math: <span class="math inline">LATEX</span>
  html = html.replace(
    /<span class="math inline">([\s\S]*?)<\/span>/g,
    (match: any, latex: any): any => {
      try {
        const decoded = decodeEntities(latex.trim());
        inlineCount++;
        return katex.renderToString(decoded, {
          displayMode: false,
          throwOnError: false,
          output: "html",
          strict: false,
        });
      } catch (e: any) {
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
    (match: any, latex: any): any => {
      try {
        const decoded = decodeEntities(latex.trim());
        displayCount++;
        return katex.renderToString(decoded, {
          displayMode: true,
          throwOnError: false,
          output: "html",
          strict: false,
        });
      } catch (e: any) {
        errorCount++;
        console.error(
          `  Display math error: ${e.message} | Source: ${latex.substring(0, 60)}`,
        );
        return match;
      }
    },
  );
  fs.writeFileSync(outputPath, html, "utf8");
  return {
    inline: inlineCount,
    display: displayCount,
    errors: errorCount,
  };
}
export function main(argv: readonly string[]): any {
  if (argv.length < 2) {
    console.error("Usage: node katex_render.mjs <input.html> <output.html>");
    return 1;
  }
  try {
    const stats = renderKatexFile(argv[0], argv[1]);
    // Output stats as JSON on the last line for parsing by md_to_pdf.mjs.
    console.log(JSON.stringify(stats));
    return 0;
  } catch (error: any) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
