import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/frontend-expert");

const nodeScripts = [
  "hooks/dispatch.mjs",
  "skills/icon-retrieval/scripts/search.mjs",
  "skills/i18n-localization/scripts/i18n_checker.mjs",
  "skills/lottie-animations/scripts/generate_lottie_component.mjs",
  "skills/lottie-animations/scripts/optimize_lottie.mjs",
  "skills/shadcn-ui/scripts/verify-setup.mjs",
  "skills/web-quality-audit/scripts/analyze.mjs",
];

const pythonScripts = [
  "skills/modern-web-design/scripts/design_audit.py",
  "skills/modern-web-design/scripts/pattern_generator.py",
];

test("所有 Node 脚本都能通过语法检查", () => {
  for (const relativePath of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
  }
});

test("所有 Python 脚本都能通过 py_compile", () => {
  const pycacheRoot = mkdtempSync(join(tmpdir(), "frontend-pycache-"));
  const result = spawnSync("python3", ["-m", "py_compile", ...pythonScripts.map((path) => resolve(pluginRoot, path))], {
    encoding: "utf-8",
    env: {
      ...process.env,
      PYTHONPYCACHEPREFIX: pycacheRoot,
    },
  });

  try {
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(pycacheRoot, { recursive: true, force: true });
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
