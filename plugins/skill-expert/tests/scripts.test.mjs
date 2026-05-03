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

test("复制进插件的 Python 脚本都能通过 py_compile", () => {
  const files = collectFiles(resolve(pluginRoot, "skills"), (file) => file.endsWith(".py"));
  if (files.length === 0) {
    assert.ok(true);
    return;
  }
  execFileSync("python3", ["-m", "py_compile", ...files], { stdio: "pipe" });
  assert.ok(true);
});

test("cso_audit 递归扫描嵌套 skill 并保留完整相对路径", () => {
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
      resolve(pluginRoot, "skills/skill-activation-analyzer/scripts/cso_audit.mjs"),
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

test("skill-creator quick_validate.mjs 校验 frontmatter", () => {
  const tmp = mkdtempSync(join(tmpdir(), "skill-creator-validate-"));
  const skill = resolve(tmp, "demo-skill");
  mkdirSync(skill, { recursive: true });
  writeFileSync(resolve(skill, "SKILL.md"), "---\nname: demo-skill\ndescription: \"Use when validating demo skills.\"\n---\n", "utf-8");

  try {
    const script = resolve(pluginRoot, "skills/skill-creator/scripts/quick_validate.mjs");
    const valid = execFileSync("node", [script, skill], { encoding: "utf-8", stdio: "pipe" });
    assert.match(valid, /Skill 校验通过！/);

    writeFileSync(resolve(skill, "SKILL.md"), "---\nname: Demo Skill\ndescription: bad\n---\n", "utf-8");
    assert.throws(() => execFileSync("node", [script, skill], { stdio: "pipe" }));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("skill-creator package_skill.mjs 生成 .skill 并排除 root evals", () => {
  const tmp = mkdtempSync(join(tmpdir(), "skill-creator-package-"));
  const skill = resolve(tmp, "demo-skill");
  const dist = resolve(tmp, "dist");
  mkdirSync(resolve(skill, "evals"), { recursive: true });
  mkdirSync(resolve(skill, "assets"), { recursive: true });
  writeFileSync(resolve(skill, "SKILL.md"), "---\nname: demo-skill\ndescription: \"Use when packaging demo skills.\"\n---\n", "utf-8");
  writeFileSync(resolve(skill, "evals", "cases.yaml"), "cases: []\n", "utf-8");
  writeFileSync(resolve(skill, "assets", "sample.txt"), "sample\n", "utf-8");

  try {
    const script = resolve(pluginRoot, "skills/skill-creator/scripts/package_skill.mjs");
    const output = execFileSync("node", [script, skill, dist], { encoding: "utf-8", stdio: "pipe" });
    assert.match(output, /Skill 打包完成/);
    assert.match(output, /已添加：demo-skill\/SKILL\.md/);
    assert.match(output, /已跳过：demo-skill\/evals\/cases\.yaml/);

    const archive = readFileSync(resolve(dist, "demo-skill.skill"));
    assert.ok(archive.length > 0);
    assert.equal(archive.readUInt32LE(0), 0x04034b50);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
