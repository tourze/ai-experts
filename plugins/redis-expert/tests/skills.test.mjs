import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { run as runRedisCliRiskGuard } from "../hooks/pre-tool-use/bash/redis-cli-risk-guard.mjs";

const pluginRoot = resolve("plugins/redis-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const readmePath = resolve(pluginRoot, "README.md");
const requiredSections = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];
const forbiddenPatterns = [
  /\$\{selection\}/,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bTBD\b/i,
  /SETNX\s+\S+\s+\S+\s+EX\s+\d+/,
];

function getSkillDirs() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function getSectionBody(markdown, title) {
  const heading = `## ${title}`;
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `${readmePath} 缺少 ${heading}`);

  const bodyStart = start + heading.length;
  const nextHeadingOffset = markdown.slice(bodyStart).search(/\n##\s+/);
  if (nextHeadingOffset < 0) {
    return markdown.slice(bodyStart);
  }
  return markdown.slice(bodyStart, bodyStart + nextHeadingOffset);
}

function extractCodeBlocks(markdown, language) {
  return [...markdown.matchAll(new RegExp(`\\\`\\\`\\\`${language}\\n([\\s\\S]*?)\\\`\\\`\\\``, "g"))]
    .map((match) => match[1]);
}

test("README 技能列表与实际 skill 目录一致", () => {
  const expected = getSkillDirs();
  const readme = readFileSync(readmePath, "utf-8");
  const listed = getSectionBody(readme, "Skills")
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.match(/\| `([^`]+)` \|/)?.[1])
    .filter(Boolean)
    .sort();

  assert.deepEqual(listed, expected);
});

for (const skillName of getSkillDirs()) {
  test(`skill ${skillName} 具备统一结构、无占位符且交叉引用有效`, () => {
    const skillPath = resolve(skillsRoot, skillName, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");
    let previousIndex = -1;

    assert.match(content, new RegExp(`name:\\s+${skillName}`));

    for (const heading of requiredSections) {
      const index = content.indexOf(heading);
      assert.notEqual(index, -1, `${skillPath} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${skillPath} 中 ${heading} 顺序不正确`);
      previousIndex = index;
    }

    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(content, pattern, `${skillPath} 仍包含禁用模式 ${pattern}`);
    }

    for (const href of extractRelativeLinks(content)) {
      const target = resolve(dirname(skillPath), href);
      assert.ok(target.startsWith(resolve("plugins")), `${skillPath} 中 ${href} 越界`);
      assert.ok(existsSync(target), `${skillPath} 中交叉引用不存在：${href}`);
      assert.ok(readFileSync(target, "utf-8").length > 0, `${skillPath} 中交叉引用为空：${href}`);
    }
  });
}

test("Redis skill 中的 Python 示例可通过 py_compile", () => {
  for (const skillName of getSkillDirs()) {
    const skillPath = resolve(skillsRoot, skillName, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");
    const codeBlocks = extractCodeBlocks(content, "python");

    if (codeBlocks.length === 0) continue;

    const tempDir = mkdtempSync(join(tmpdir(), "redis-expert-skill-"));
    try {
      codeBlocks.forEach((code, index) => {
        const tempFile = join(tempDir, `${skillName}-${index}.py`);
        writeFileSync(tempFile, code, "utf8");

        const result = spawnSync("python3", ["-m", "py_compile", tempFile], {
          encoding: "utf-8",
        });

        assert.equal(
          result.status,
          0,
          `${skillPath} 第 ${index + 1} 个 Python 示例语法错误：${result.stderr || result.stdout}`,
        );
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

function bashPayload(command) {
  return { tool_input: { command } };
}

test("redis-cli-risk-guard 拦截高风险遍历和清库命令", async () => {
  const keysResult = await runRedisCliRiskGuard(
    bashPayload("redis-cli -h cache.local -p 6379 KEYS '*'"),
  );
  assert.equal(keysResult?.decision, "block");
  assert.match(keysResult.reason, /KEYS/);

  const monitorResult = await runRedisCliRiskGuard(
    bashPayload("redis-cli --raw monitor"),
  );
  assert.equal(monitorResult?.decision, "block");
  assert.match(monitorResult.reason, /MONITOR/);

  const flushResult = await runRedisCliRiskGuard(
    bashPayload("redis-cli -n 1 FLUSHDB"),
  );
  assert.equal(flushResult?.decision, "block");
  assert.match(flushResult.reason, /FLUSHDB/);

  const clusterCallResult = await runRedisCliRiskGuard(
    bashPayload("redis-cli --cluster call 127.0.0.1:7000 FLUSHALL"),
  );
  assert.equal(clusterCallResult?.decision, "block");
  assert.match(clusterCallResult.reason, /FLUSHALL/);
});

test("redis-cli-risk-guard 对可疑但非破坏命令只提示", async () => {
  const delResult = await runRedisCliRiskGuard(bashPayload("redis-cli DEL big:set"));
  assert.equal(delResult?.decision, "report");
  assert.match(delResult.reason, /UNLINK/);

  const setbitResult = await runRedisCliRiskGuard(
    bashPayload("redis-cli -c -n 1 SETBIT bitmap:uv 4294967295 1"),
  );
  assert.equal(setbitResult?.decision, "report");
  assert.match(setbitResult.reason, /SETBIT/);
});

test("redis-cli-risk-guard 跳过安全扫描和非 redis-cli 命令", async () => {
  assert.equal(
    await runRedisCliRiskGuard(bashPayload("redis-cli --scan --pattern 'user:*'")),
    null,
  );
  assert.equal(await runRedisCliRiskGuard(bashPayload("redis-cli GET KEYS")), null);
  assert.equal(await runRedisCliRiskGuard(bashPayload("rg 'redis-cli KEYS' docs/")), null);
  assert.equal(await runRedisCliRiskGuard(bashPayload("rg redis-cli KEYS docs/")), null);
  assert.equal(await runRedisCliRiskGuard(bashPayload("echo redis-cli KEYS '*'")), null);
});
