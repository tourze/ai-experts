import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/frontend-expert");

const nodeScripts = [
  "skills/icon-retrieval/scripts/search.mjs",
  "skills/i18n-localization/scripts/i18n_checker.mjs",
  "skills/lottie-animations/scripts/generate_lottie_component.mjs",
  "skills/lottie-animations/scripts/optimize_lottie.mjs",
  "skills/modern-web-design/scripts/design_audit.mjs",
  "skills/modern-web-design/scripts/pattern_generator.mjs",
  "skills/shadcn-ui/scripts/verify-setup.mjs",
  "skills/web-quality-audit/scripts/analyze.mjs",
];

test("所有 Node 脚本都能通过语法检查", () => {
  for (const relativePath of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
  }
});

test("generate_lottie_component.mjs 可生成 React interactive 模板", () => {
  const result = spawnSync("node", [
    resolve(pluginRoot, "skills/lottie-animations/scripts/generate_lottie_component.mjs"),
    "--framework", "react",
    "--type", "interactive",
    "--name", "DemoAnimation",
    "--src", "/animations/demo.lottie",
    "--height", "300",
    "--width", "280",
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /import React, \{ useState \} from 'react';/);
  assert.match(result.stdout, /style=\{\{ height: 300, width: 280 \}\}/);
  assert.match(result.stdout, /dotLottieRefCallback=\{setDotLottie\}/);
});

test("pattern_generator.mjs 能列出并生成模板文件", () => {
  const root = mkdtempSync(join(tmpdir(), "frontend-pattern-"));
  const outputPath = join(root, "hero.html");

  try {
    const listResult = spawnSync("node", [
      resolve(pluginRoot, "skills/modern-web-design/scripts/pattern_generator.mjs"),
      "--list",
    ], {
      encoding: "utf-8",
    });
    assert.equal(listResult.status, 0, listResult.stderr);
    assert.match(listResult.stdout, /hero\s+- Immersive Hero Section/);

    const generateResult = spawnSync("node", [
      resolve(pluginRoot, "skills/modern-web-design/scripts/pattern_generator.mjs"),
      "--pattern", "hero",
      "--output", outputPath,
    ], {
      encoding: "utf-8",
    });
    assert.equal(generateResult.status, 0, generateResult.stderr);
    assert.match(generateResult.stdout, /Generated 'Immersive Hero Section' pattern/);
    assert.match(readFileSync(outputPath, "utf-8"), /<section class="hero">/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("optimize_lottie.mjs 压缩 JSON 并保留整数", () => {
  const root = mkdtempSync(join(tmpdir(), "frontend-lottie-"));
  const inputPath = join(root, "animation.json");
  const outputPath = join(root, "animation.optimized.json");
  writeFileSync(inputPath, JSON.stringify({ w: 120, layers: [{ ks: { x: 1.2345 } }] }, null, 2), "utf-8");

  try {
    const result = spawnSync("node", [
      resolve(pluginRoot, "skills/lottie-animations/scripts/optimize_lottie.mjs"),
      inputPath,
      "--output",
      outputPath,
      "--precision",
      "2",
    ], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(readFileSync(outputPath, "utf-8"));
    assert.equal(output.w, 120);
    assert.equal(output.layers[0].ks.x, 1.23);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("i18n_checker.mjs 能发现硬编码文案并返回失败码", () => {
  const root = mkdtempSync(join(tmpdir(), "frontend-i18n-"));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "App.jsx"), "export function App() { return <button>Submit Form</button>; }\n", "utf-8");

  try {
    const result = spawnSync("node", [
      resolve(pluginRoot, "skills/i18n-localization/scripts/i18n_checker.mjs"),
      root,
    ], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /files may have hardcoded strings/);
    assert.match(result.stdout, /i18n CHECK: 1 issues found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("design_audit.mjs 能生成 HTML 审计报告", () => {
  const root = mkdtempSync(join(tmpdir(), "frontend-design-audit-"));
  const inputPath = join(root, "index.html");
  const reportPath = join(root, "audit.txt");
  writeFileSync(inputPath, "<html><head><title>x</title></head><body><img src=\"hero.png\"><h1>Hi</h1></body></html>\n", "utf-8");

  try {
    const result = spawnSync("node", [
      resolve(pluginRoot, "skills/modern-web-design/scripts/design_audit.mjs"),
      "--file",
      inputPath,
      "--report",
      reportPath,
    ], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Audit complete/);
    const report = readFileSync(reportPath, "utf-8");
    assert.match(report, /Modern Web Design Audit Report/);
    assert.match(report, /images without alt attributes/);
    assert.match(report, /Missing viewport meta tag/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("analyze.mjs 在目录模式下能输出有效 JSON 结果", () => {
  const root = mkdtempSync(join(tmpdir(), "frontend-audit-"));
  const htmlFile = join(root, "index.html");
  writeFileSync(
    htmlFile,
    '<html><head><title>x</title></head><body><img src="hero.png"></body></html>',
    "utf-8",
  );

  try {
    const result = spawnSync("node", [
      resolve(pluginRoot, "skills/web-quality-audit/scripts/analyze.mjs"),
      root,
    ], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.ok(output.issueCount >= 1);
    assert.ok(output.warningCount >= 1);
    assert.match(output.issues.join("\n"), /Missing viewport meta tag/);
    assert.match(output.warnings.join("\n"), /without alt text/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("verify-setup.mjs 支持 Tailwind v4 CSS-first 项目", () => {
  const root = mkdtempSync(join(tmpdir(), "frontend-shadcn-"));
  mkdirSync(join(root, "src", "lib"), { recursive: true });
  mkdirSync(join(root, "components"), { recursive: true });
  mkdirSync(join(root, "components", "ui"), { recursive: true });
  mkdirSync(join(root, "app"), { recursive: true });

  writeFileSync(join(root, "components.json"), '{"aliases":{"components":"@/components","utils":"@/lib/utils"}}', "utf-8");
  writeFileSync(join(root, "tsconfig.json"), '{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}', "utf-8");
  writeFileSync(join(root, "app", "globals.css"), '@import "tailwindcss";\n:root { --background: #fff; }\n', "utf-8");
  writeFileSync(join(root, "src", "lib", "utils.ts"), 'export function cn(...classes: string[]) { return classes.filter(Boolean).join(" "); }\n', "utf-8");
  writeFileSync(join(root, "package.json"), '{"dependencies":{"react":"19.0.0"},"devDependencies":{"tailwindcss":"4.0.0","class-variance-authority":"1.0.0","clsx":"2.0.0","tailwind-merge":"3.0.0"}}', "utf-8");

  try {
    const result = spawnSync("node", [
      resolve(pluginRoot, "skills/shadcn-ui/scripts/verify-setup.mjs"),
    ], {
      cwd: root,
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Tailwind v4 CSS-first import present/);
    assert.match(result.stdout, /Tailwind v4 can run without tailwind\.config/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
