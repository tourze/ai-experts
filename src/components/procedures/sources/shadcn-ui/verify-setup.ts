#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * shadcn/ui Setup Verification Script
 * Validates that a project is correctly configured for shadcn/ui.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const procedure = defineCliProcedure({
  id: "shadcn-ui-verify-setup",
  entry: procedureEntry(import.meta.url),
  description:
    "验证 shadcn/ui 项目配置完整性：检查 components.json、Tailwind 配置、路径别名、CSS 变量、cn() 工具函数和推荐依赖。",
  owners: { skillIds: ["shadcn-ui"] },
  target: "scripts/verify-setup.mjs",
  runtime: "node",

  exampleArgs: { args: [] },
});

export function main(argv: readonly string[]): any {
  const GREEN = "\x1b[0;32m";
  const RED = "\x1b[0;31m";
  const YELLOW = "\x1b[1;33m";
  const NC = "\x1b[0m";
  function logOk(message: any): any {
    console.log(`${GREEN}✓${NC} ${message}`);
  }
  function logError(message: any): any {
    console.log(`${RED}✗${NC} ${message}`);
  }
  function logWarn(message: any): any {
    console.log(`${YELLOW}⚠${NC} ${message}`);
  }
  function fileExists(path: any): any {
    return existsSync(path) && statSync(path).isFile();
  }
  function dirExists(path: any): any {
    return existsSync(path) && statSync(path).isDirectory();
  }
  function readIfExists(path: any): any {
    return fileExists(path) ? readFileSync(path, "utf8") : "";
  }
  function walkFiles(root: any, predicate: any, results: any = []): any {
    if (!existsSync(root)) {
      return results;
    }
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      const fullPath = join(root, entry.name);
      if (entry.isDirectory()) {
        walkFiles(fullPath, predicate, results);
      } else if (entry.isFile() && predicate(fullPath)) {
        results.push(fullPath);
      }
    }
    return results;
  }
  function findCssFile(): any {
    return (
      walkFiles(".", (path: any) =>
        /(?:^|\/)(globals|index|app)\.css$/.test(path),
      ).sort()[0] ?? null
    );
  }
  function countInstalledComponents(): any {
    return walkFiles(".", (path: any) =>
      /(?:^|\/)components\/ui\/[^/]+\.(tsx|jsx)$/.test(path),
    ).length;
  }
  function dependencyExists(packageSource: any, dependency: any): any {
    return new RegExp(`"${dependency}"`).test(packageSource);
  }
  console.log("🔍 Verifying shadcn/ui setup...");
  console.log("");
  if (fileExists("components.json")) {
    logOk("components.json found");
  } else {
    logError("components.json not found");
    console.log(`${YELLOW}Run:${NC} npx shadcn@latest init`);
    process.exit(1);
  }
  let tailwindConfigFound = false;
  if (
    fileExists("tailwind.config.js") ||
    fileExists("tailwind.config.ts") ||
    fileExists("tailwind.config.cjs") ||
    fileExists("tailwind.config.mjs")
  ) {
    tailwindConfigFound = true;
    logOk("Tailwind config found");
  }
  if (fileExists("tsconfig.json")) {
    if (readIfExists("tsconfig.json").includes('"@/*"')) {
      logOk("Path aliases configured in tsconfig.json");
    } else {
      logWarn("Path aliases not found in tsconfig.json");
      console.log("  Add to compilerOptions.paths:");
      console.log('  "@/*": ["./src/*"]');
    }
  } else {
    logWarn("tsconfig.json not found (TypeScript not configured)");
  }
  let cssFile: any = null;
  if (
    fileExists("src/index.css") ||
    fileExists("src/globals.css") ||
    fileExists("app/globals.css") ||
    fileExists("src/app.css") ||
    fileExists("app.css")
  ) {
    logOk("Global CSS file found");
    cssFile = findCssFile();
    const cssSource = cssFile ? readIfExists(cssFile) : "";
    if (cssSource.includes('@import "tailwindcss"')) {
      logOk("Tailwind v4 CSS-first import present");
    } else if (cssSource.includes("@tailwind base")) {
      logOk("Tailwind v3 directives present");
    } else {
      logError("Tailwind directives missing");
      console.log("  Add to your CSS file:");
      console.log('  Tailwind v4: @import "tailwindcss";');
      console.log(
        "  Tailwind v3: @tailwind base; @tailwind components; @tailwind utilities;",
      );
    }
    if (/^:root/m.test(cssSource) || cssSource.includes("@layer base")) {
      logOk("CSS variables defined");
    } else {
      logWarn("CSS variables not found");
      console.log("  shadcn/ui requires CSS variables for theming");
    }
  } else {
    logError("Global CSS file not found");
  }
  if (
    !tailwindConfigFound &&
    cssFile &&
    readIfExists(cssFile).includes('@import "tailwindcss"')
  ) {
    logOk("Tailwind v4 can run without tailwind.config.*");
  } else if (!tailwindConfigFound) {
    logError("Tailwind config not found");
    console.log(
      `${YELLOW}Install Tailwind:${NC} npm install -D tailwindcss postcss autoprefixer`,
    );
    process.exit(1);
  }
  if (dirExists("src/components/ui") || dirExists("components/ui")) {
    logOk("components/ui directory exists");
    console.log(`  ${countInstalledComponents()} components installed`);
  } else {
    logWarn("components/ui directory not found");
    console.log("  Add your first component: npx shadcn@latest add button");
  }
  if (fileExists("src/lib/utils.ts") || fileExists("lib/utils.ts")) {
    logOk("lib/utils.ts exists");
    const utilsFile = walkFiles(".", (path: any): any =>
      /(?:^|\/)lib\/utils\.ts$/.test(path),
    ).sort()[0];
    if (
      utilsFile &&
      /export (function|const) cn/.test(readIfExists(utilsFile))
    ) {
      logOk("cn() utility function present");
    } else {
      logError("cn() utility function missing");
    }
  } else {
    logError("lib/utils.ts not found");
  }
  if (fileExists("package.json")) {
    console.log("");
    console.log("📦 Checking dependencies...");
    const packageSource = readIfExists("package.json");
    for (const dep of ["react", "tailwindcss"]) {
      if (dependencyExists(packageSource, dep)) {
        logOk(`${dep} installed`);
      } else {
        logError(`${dep} not installed`);
      }
    }
    console.log("");
    console.log("Recommended dependencies:");
    for (const dep of ["class-variance-authority", "clsx", "tailwind-merge"]) {
      if (dependencyExists(packageSource, dep)) {
        logOk(`${dep} installed`);
      } else {
        logWarn(`${dep} not installed (recommended)`);
      }
    }
  }
  console.log("");
  logOk("Setup verification complete!");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Add components: npx shadcn@latest add [component]");
  console.log("  2. View catalog: npx shadcn@latest add --help");
  console.log("  3. Browse docs: https://ui.shadcn.com");
}
