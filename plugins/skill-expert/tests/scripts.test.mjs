import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function collectFiles(dir, predicate) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

test("hook 脚本都能通过 node --check", () => {
  const files = [
    ...collectFiles(resolve(pluginRoot, "hooks"), (file) => file.endsWith(".mjs")),
    ...collectFiles(resolve(pluginRoot, "skills"), (file) => file.endsWith(".mjs")),
  ];
  for (const file of files) {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  }
});

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
  assert.ok(true);
});

test("复制进插件的 Python 脚本都能通过 py_compile", () => {
  const files = collectFiles(resolve(pluginRoot, "skills"), (file) => file.endsWith(".py"));
  execFileSync("python3", ["-m", "py_compile", ...files], { stdio: "pipe" });
  assert.ok(files.length > 0);
});

test("description-cso-audit 递归扫描嵌套 skill 并保留完整相对路径", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-cso-audit-"));

  try {
    const top = resolve(tmp, "plugins/demo-expert/skills/top");
    const nested = resolve(tmp, "plugins/demo-expert/skills/group/sub/nested");
    mkdirSync(top, { recursive: true });
    mkdirSync(nested, { recursive: true });
    writeFileSync(
      resolve(top, "SKILL.md"),
      "---\nname: top\ndescription: \"Use when the user asks for a top skill.\"\n---\n",
      "utf-8",
    );
    writeFileSync(
      resolve(nested, "SKILL.md"),
      "---\nname: nested\ndescription: \"bad\"\n---\n",
      "utf-8",
    );

    const output = execFileSync("node", [
      resolve(pluginRoot, "skills/description-cso-audit/scripts/cso_audit.mjs"),
      "--plugins-dir",
      resolve(tmp, "plugins"),
      "--json",
    ], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const report = JSON.parse(output);

    assert.equal(report.total, 2);
    assert.ok(
      report.violations.some((item) => item.skill === "demo-expert/group/sub/nested"),
      "nested skill should be reported as plugin/full/relative/path",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
