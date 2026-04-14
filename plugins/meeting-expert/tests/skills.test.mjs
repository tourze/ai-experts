import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/meeting-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const skillFiles = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((entry) => resolve(skillsRoot, entry.name, "SKILL.md"));

const REQUIRED_HEADINGS = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function readSource(filePath) {
  return readFileSync(filePath, "utf-8");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "缺少 frontmatter");

  const data = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!kv) continue;
    data[kv[1]] = kv[2].replace(/^['"]|['"]$/g, "");
  }
  return data;
}

function extractCodeBlocks(source) {
  const blocks = [];
  const regex = /```([a-zA-Z0-9_-]+)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    blocks.push({ lang: match[1].toLowerCase(), code: match[2] });
  }
  return blocks;
}

function extractRelativeLinks(source) {
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const target = match[1];
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    links.push(target);
  }
  return links;
}

test("所有技能文档都使用统一结构与合法 frontmatter", () => {
  for (const file of skillFiles) {
    const source = readSource(file);
    const frontmatter = parseFrontmatter(source);
    const dirName = dirname(file).split("/").at(-1);

    assert.equal(frontmatter.name, dirName, `${file} 的 frontmatter.name 必须与目录名一致`);
    assert.match(frontmatter.name, /^[a-z0-9-]+$/, `${file} 的 skill 名称必须是 kebab-case`);
    assert.ok(frontmatter.description, `${file} 缺少 description`);

    let previousIndex = -1;
    for (const heading of REQUIRED_HEADINGS) {
      const index = source.indexOf(heading);
      assert.ok(index >= 0, `${file} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${file} 的标题顺序不正确：${heading}`);
      previousIndex = index;
    }

    assert.doesNotMatch(source, /^## (Overview|Process|Rules|Inputs|Instructions|Output Format|Purpose \/ Overview|When to Use|Operational Workflow|Discovery|Strict Minutes Schema|Style & Quality Rules|DO \/ DON'T|Example Prompts|Quick Templates|Verification & Acceptance Criteria for Generated Minutes)\b/m, `${file} 仍残留旧结构标题`);
  }
});

test("所有相对链接都能命中有效文件", () => {
  for (const file of skillFiles) {
    const source = readSource(file);
    for (const link of extractRelativeLinks(source)) {
      const resolved = resolve(dirname(file), link);
      assert.ok(resolved.startsWith(pluginRoot), `${file} 的链接越界：${link}`);
      assert.equal(
        spawnSync("test", ["-e", resolved]).status,
        0,
        `${file} 的链接不存在：${link}`,
      );
    }
  }
});

test("所有 bash/sh 示例都能通过 bash -n", () => {
  for (const file of skillFiles) {
    const source = readSource(file);
    const blocks = extractCodeBlocks(source).filter((block) => block.lang === "bash" || block.lang === "sh");

    for (const [index, block] of blocks.entries()) {
      const result = spawnSync("bash", ["-n"], {
        encoding: "utf-8",
        input: block.code,
      });
      assert.equal(
        result.status,
        0,
        `${file} 的代码块 #${index + 1} 语法错误：${result.stderr || result.stdout}`,
      );
    }
  }
});

test("技能文档中不存在 TODO/FIXME/HACK 标记", () => {
  for (const file of skillFiles) {
    const source = readSource(file);
    assert.doesNotMatch(source, /\b(TODO|FIXME|HACK|XXX)\b/, `${file} 仍残留待处理标记`);
  }
});
