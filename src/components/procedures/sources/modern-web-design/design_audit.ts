#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { createInterface } from "node:readline/promises";
import { existsSync, readFileSync, writeFileSync, realpathSync } from "node:fs";
import { extname } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "modern-web-design-design-audit",
  entry: procedureEntry(import.meta.url),
  description:
    "审计 HTML 文件的可访问性、性能、SEO、响应式设计和现代 CSS 实践，生成评分报告。",
  owners: { skillIds: ["modern-web-design"] },
  target: "scripts/design_audit.mjs",
  runtime: "node",
  params: [
    {
      flag: "--file",
      type: "路径",
      description: "待审计的 HTML 文件路径",
      required: false,
    },
    {
      flag: "--report",
      type: "路径",
      description: "审计报告输出路径",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["--file", "index.html", "--report", "audit-report.txt"],
  },
});

function add(target: any, category: any, message: any): any {
  if (!target.has(category)) {
    target.set(category, []);
  }
  target.get(category).push(message);
}
function getAllCategories(...maps: any): any {
  return [...new Set(maps.flatMap((map: any) => [...map.keys()]))].sort();
}
export class DesignAuditor {
  html: any;
  issues: any;
  passes: any;
  warnings: any;
  constructor(htmlContent: any) {
    this.html = htmlContent;
    this.issues = new Map();
    this.warnings = new Map();
    this.passes = new Map();
  }
  audit(): any {
    this.auditAccessibility();
    this.auditPerformance();
    this.auditSeo();
    this.auditResponsive();
    this.auditModernPractices();
  }
  auditAccessibility(): any {
    const category = "Accessibility";
    const imgsWithoutAlt = this.html.match(/<img(?![^>]*alt=)[^>]*>/gi) ?? [];
    if (imgsWithoutAlt.length > 0) {
      add(
        this.issues,
        category,
        `Found ${imgsWithoutAlt.length} images without alt attributes`,
      );
    } else {
      add(this.passes, category, "All images have alt attributes");
    }
    if (!/<html[^>]+lang=/i.test(this.html)) {
      add(this.issues, category, "Missing lang attribute on <html> element");
    } else {
      add(this.passes, category, "HTML lang attribute present");
    }
    if (
      this.html.includes('<div class="header"') ||
      this.html.includes('<div id="header"')
    ) {
      add(
        this.warnings,
        category,
        "Consider using <header> instead of div with class/id 'header'",
      );
    }
    if (
      this.html.includes('<div class="nav"') ||
      this.html.includes('<div id="nav"')
    ) {
      add(
        this.warnings,
        category,
        "Consider using <nav> instead of div with class/id 'nav'",
      );
    }
    if (
      this.html.includes('<div class="footer"') ||
      this.html.includes('<div id="footer"')
    ) {
      add(
        this.warnings,
        category,
        "Consider using <footer> instead of div with class/id 'footer'",
      );
    }
    const h1Count = (this.html.match(/<h1[^>]*>/gi) ?? []).length;
    if (h1Count === 0) {
      add(this.issues, category, "No <h1> element found");
    } else if (h1Count > 1) {
      add(
        this.warnings,
        category,
        `Multiple <h1> elements found (${h1Count}). Consider using only one per page`,
      );
    }
    const iconButtons =
      this.html.match(
        /<button[^>]*>[\s]*<(?:svg|i|span)[^>]*>[\s]*<\/(?:svg|i|span)>[\s]*<\/button>/gi,
      ) ?? [];
    if (iconButtons.some((button: any) => !button.includes("aria-label"))) {
      add(this.warnings, category, "Icon button found without aria-label");
    }
    const inputs = this.html.match(/<input[^>]*>/gi) ?? [];
    for (const inputTag of inputs) {
      if (!inputTag.includes("id=")) {
        continue;
      }
      const inputId = inputTag.match(/id="([^"]+)"/);
      if (inputId && !this.html.includes(`for="${inputId[1]}"`)) {
        add(
          this.warnings,
          category,
          `Input with id='${inputId[1]}' has no associated label`,
        );
      }
    }
    if (!/skip to (main |)content/i.test(this.html)) {
      add(
        this.warnings,
        category,
        "Consider adding a skip link for keyboard navigation",
      );
    }
  }
  auditPerformance(): any {
    const category = "Performance";
    const inlineStyles = this.html.match(/style="[^"]*"/g) ?? [];
    if (inlineStyles.length > 10) {
      add(
        this.warnings,
        category,
        `Found ${inlineStyles.length} inline styles. Consider moving to external CSS.`,
      );
    }
    const imgs = this.html.match(/<img[^>]*>/gi) ?? [];
    const lazyImgs = imgs.filter(
      (img: any) =>
        img.includes('loading="lazy"') || img.includes("loading='lazy'"),
    );
    if (imgs.length > 0 && lazyImgs.length === 0) {
      add(
        this.warnings,
        category,
        "Consider adding loading='lazy' to below-fold images",
      );
    }
    if (
      /<img[^>]+src="[^"]+\.(jpg|jpeg|png)"/i.test(this.html) &&
      !/<picture>|<source[^>]+type="image\/webp"/i.test(this.html)
    ) {
      add(
        this.warnings,
        category,
        "Consider using modern image formats (WebP/AVIF) with <picture> element",
      );
    }
    if (/<link[^>]+rel="preload"/i.test(this.html)) {
      add(this.passes, category, "Using preload for critical resources");
    }
    const scripts = this.html.match(/<script[^>]*src="[^"]*"[^>]*>/gi) ?? [];
    const scriptsWithoutAsyncDefer = scripts.filter(
      (script: any) => !script.includes("async") && !script.includes("defer"),
    );
    if (scriptsWithoutAsyncDefer.length > 0) {
      add(
        this.warnings,
        category,
        `Found ${scriptsWithoutAsyncDefer.length} script tags without async or defer attributes`,
      );
    }
    const imgsWithoutDimensions = imgs.filter(
      (img: any) =>
        !(
          (img.includes("width=") && img.includes("height=")) ||
          this.html.includes("aspect-ratio")
        ),
    );
    if (imgsWithoutDimensions.length > 0) {
      add(
        this.warnings,
        category,
        `Found ${imgsWithoutDimensions.length} images without explicit dimensions (width/height). This can cause Cumulative Layout Shift.`,
      );
    }
  }
  auditSeo(): any {
    const category = "SEO";
    const title = this.html.match(/<title>([^<]+)<\/title>/i);
    if (!title) {
      add(this.issues, category, "Missing <title> tag");
    } else if (title[1].length < 10) {
      add(this.warnings, category, "Title tag is too short (< 10 characters)");
    } else {
      add(this.passes, category, "Title tag present and sufficient length");
    }
    if (!/<meta[^>]+name="description"/i.test(this.html)) {
      add(this.warnings, category, "Missing meta description tag");
    } else {
      add(this.passes, category, "Meta description present");
    }
    if (!/<meta[^>]+name="viewport"/i.test(this.html)) {
      add(
        this.issues,
        category,
        "Missing viewport meta tag (required for mobile)",
      );
    } else {
      add(this.passes, category, "Viewport meta tag present");
    }
    if (!/<meta[^>]+charset=/i.test(this.html)) {
      add(this.warnings, category, "Missing charset declaration");
    } else {
      add(this.passes, category, "Charset declaration present");
    }
  }
  auditResponsive(): any {
    const category = "Responsive Design";
    if (/<meta[^>]+name="viewport"/i.test(this.html)) {
      add(this.passes, category, "Viewport meta tag present");
    } else {
      add(this.issues, category, "Missing viewport meta tag");
    }
    if (/@media[^{]+{/i.test(this.html)) {
      add(this.passes, category, "Media queries found (responsive CSS)");
    } else {
      add(
        this.warnings,
        category,
        "No media queries found. Consider adding responsive styles.",
      );
    }
    if (/clamp\(|min\(|max\(/i.test(this.html)) {
      add(
        this.passes,
        category,
        "Using modern CSS functions (clamp/min/max) for fluid sizing",
      );
    }
  }
  auditModernPractices(): any {
    const category = "Modern Practices";
    if (/--[a-z-]+:/i.test(this.html)) {
      add(this.passes, category, "Using CSS custom properties (variables)");
    }
    if (/display:\s*(grid|flex)/i.test(this.html)) {
      add(this.passes, category, "Using modern layout (Grid or Flexbox)");
    }
    if (/prefers-reduced-motion/i.test(this.html)) {
      add(
        this.passes,
        category,
        "Respecting prefers-reduced-motion preference",
      );
    } else if (/animation:|transition:/i.test(this.html)) {
      add(
        this.warnings,
        category,
        "Animations found but no @media (prefers-reduced-motion) rule detected",
      );
    }
    const semanticElements: any[] = [
      "header",
      "nav",
      "main",
      "article",
      "section",
      "aside",
      "footer",
    ];
    const lowerHtml = this.html.toLowerCase();
    const foundSemantic = semanticElements.filter((element: any) =>
      lowerHtml.includes(`<${element}`),
    );
    if (foundSemantic.length > 0) {
      add(
        this.passes,
        category,
        `Using semantic HTML5 elements: ${foundSemantic.join(", ")}`,
      );
    } else {
      add(
        this.warnings,
        category,
        "No semantic HTML5 elements found. Consider using <header>, <nav>, <main>, etc.",
      );
    }
    if (this.html.includes(":focus-visible")) {
      add(
        this.passes,
        category,
        "Using :focus-visible for keyboard navigation",
      );
    } else if (this.html.includes(":focus")) {
      add(
        this.passes,
        category,
        "Using :focus styles (consider upgrading to :focus-visible)",
      );
    }
  }
  generateReport(): any {
    const report: any[] = [
      "=".repeat(70),
      "Modern Web Design Audit Report",
      "=".repeat(70),
      "",
    ];
    const totalIssues = [...this.issues.values()].reduce(
      (sum: any, items: any) => sum + items.length,
      0,
    );
    const totalWarnings = [...this.warnings.values()].reduce(
      (sum: any, items: any) => sum + items.length,
      0,
    );
    const totalPasses = [...this.passes.values()].reduce(
      (sum: any, items: any) => sum + items.length,
      0,
    );
    const totalChecks = totalPasses + totalWarnings + totalIssues;
    const score = totalChecks > 0 ? (totalPasses / totalChecks) * 100 : 0;
    report.push("SUMMARY");
    report.push("-".repeat(70));
    report.push(`❌ Issues: ${totalIssues}`);
    report.push(`⚠️  Warnings: ${totalWarnings}`);
    report.push(`✅ Passes: ${totalPasses}`);
    report.push("");
    report.push(`Overall Score: ${score.toFixed(1)}/100`);
    report.push("");
    for (const category of getAllCategories(
      this.issues,
      this.warnings,
      this.passes,
    )) {
      report.push(`\n${category}`);
      report.push("-".repeat(70));
      if (this.issues.has(category)) {
        report.push("\n❌ ISSUES (must fix):");
        for (const issue of this.issues.get(category)) {
          report.push(`   • ${issue}`);
        }
      }
      if (this.warnings.has(category)) {
        report.push("\n⚠️  WARNINGS (should fix):");
        for (const warning of this.warnings.get(category)) {
          report.push(`   • ${warning}`);
        }
      }
      if (this.passes.has(category)) {
        report.push("\n✅ PASSES:");
        for (const passing of this.passes.get(category)) {
          report.push(`   • ${passing}`);
        }
      }
      report.push("");
    }
    report.push("\nRECOMMENDATIONS");
    report.push("-".repeat(70));
    if (totalIssues > 0) {
      report.push(
        "1. Address all ISSUES first (accessibility and critical SEO)",
      );
    }
    if (totalWarnings > 5) {
      report.push("2. Review WARNINGS and implement fixes where applicable");
    }
    if (score < 70) {
      report.push("3. Consider a comprehensive design review");
    } else {
      report.push("Good job! Your design follows many modern best practices.");
    }
    report.push("");
    report.push("=".repeat(70));
    return report.join("\n");
  }
}
export function auditFile(filepath: any, outputFile: any = null): any {
  if (!existsSync(filepath)) {
    console.error(`Error: File '${filepath}' not found.`);
    return 1;
  }
  if (![".html", ".htm"].includes(extname(filepath))) {
    console.log(`Warning: File '${filepath}' is not an HTML file.`);
  }
  console.log(`Auditing: ${filepath}`);
  console.log("Please wait...\n");
  const auditor = new DesignAuditor(readFileSync(filepath, "utf-8"));
  auditor.audit();
  const report = auditor.generateReport();
  if (outputFile) {
    writeFileSync(outputFile, report, "utf-8");
    console.log("✅ Audit complete!");
    console.log(`   Report saved to: ${outputFile}`);
  } else {
    console.log(report);
  }
  return 0;
}
async function interactiveMode(): Promise<any> {
  console.log(`\n${"=".repeat(70)}`);
  console.log("Modern Web Design Auditor");
  console.log("=".repeat(70));
  console.log("\nThis tool audits HTML files for:");
  console.log("  • Accessibility (WCAG compliance)");
  console.log("  • Performance best practices");
  console.log("  • SEO basics");
  console.log("  • Responsive design");
  console.log("  • Modern CSS/HTML practices");
  console.log("");
  const rl = createInterface({ input, output });
  try {
    const filepath = (await rl.question("Enter path to HTML file: ")).trim();
    if (!filepath) {
      console.error("Error: No file path provided.");
      return 1;
    }
    const saveReport = (await rl.question("\nSave report to file? (y/n): "))
      .trim()
      .toLowerCase();
    if (saveReport === "y") {
      const outputFile =
        (
          await rl.question("Enter output filename (e.g., audit-report.txt): ")
        ).trim() || "audit-report.txt";
      return auditFile(filepath, outputFile);
    }
    return auditFile(filepath);
  } finally {
    rl.close();
  }
}
function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = { file: null, report: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      args.help = true;
      continue;
    }
    if (arg === "--file" || arg === "--report") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      args[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}
function printUsage(): any {
  console.log(`Usage: node scripts/design_audit.mjs [--file <html-file>] [--report <output-file>]

Options:
  --file <html-file>       HTML file to audit
  --report <output-file>   Output file for audit report
  -h, --help               Show this help`);
}
export async function main(argv: readonly string[]): Promise<any> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return 2;
  }
  if (args.help) {
    printUsage();
    return 0;
  }
  if (args.file) {
    return auditFile(args.file, args.report);
  }
  return interactiveMode();
}
