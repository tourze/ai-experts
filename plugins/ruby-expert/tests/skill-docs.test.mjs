import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/ruby-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const requiredHeadings = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function getSkillFiles() {
  return readdirSync(skillsRoot)
    .map((name) => resolve(skillsRoot, name, "SKILL.md"))
    .filter((file) => existsSync(file));
}

function extractLinks(content) {
  return Array.from(content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    .map((match) => match[1])
    .filter((target) => !target.startsWith("http://") && !target.startsWith("https://") && !target.startsWith("#"));
}

function extractRubyCodeBlocks(content) {
  return Array.from(content.matchAll(/```ruby\n([\s\S]*?)```/g)).map((match) => match[1]);
}

test("SKILL 文档使用统一结构且没有遗留占位符", () => {
  for (const file of getSkillFiles()) {
    const content = readFileSync(file, "utf-8");

    let lastIndex = -1;
    for (const heading of requiredHeadings) {
      const index = content.indexOf(heading);
      assert.notEqual(index, -1, `${file} 缺少 ${heading}`);
      assert.ok(index > lastIndex, `${file} 中 ${heading} 顺序错误`);
      lastIndex = index;
    }

    assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, `${file} 存在遗留占位符`);
  }
});

test("SKILL 文档中的相对链接都能解析到现有文件", () => {
  for (const file of getSkillFiles()) {
    const content = readFileSync(file, "utf-8");
    for (const link of extractLinks(content)) {
      const target = resolve(dirname(file), link);
      assert.ok(existsSync(target), `${file} 引用了不存在的文件：${link}`);
    }
  }
});

test("SKILL 文档中的 Ruby 示例都能通过 ruby -c", () => {
  for (const file of getSkillFiles()) {
    const content = readFileSync(file, "utf-8");
    const blocks = extractRubyCodeBlocks(content);
    assert.ok(blocks.length > 0, `${file} 缺少 Ruby 示例代码块`);

    for (const [index, block] of blocks.entries()) {
      const tempDir = mkdtempSync(join(tmpdir(), "ruby-skill-doc-"));
      try {
        const tempFile = join(tempDir, `example-${index + 1}.rb`);
        writeFileSync(tempFile, block, "utf-8");

        const result = spawnSync("ruby", ["-c", tempFile], {
          cwd: pluginRoot,
          encoding: "utf-8",
        });

        assert.equal(
          result.status,
          0,
          `${file} 的 Ruby 示例 ${index + 1} 语法错误：${result.stderr || result.stdout}`,
        );
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }
});
