import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/windows-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const readmePath = resolve(pluginRoot, "README.md");
const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const skillFiles = skillDirs.map((dirName) => resolve(skillsRoot, dirName, "SKILL.md"));
const requiredHeadings = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function walkMarkdownFiles(root) {
  const queue = [root];
  const results = [];

  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const target = resolve(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(target);
        continue;
      }
      if (entry.isFile() && target.endsWith(".md")) {
        results.push(target);
      }
    }
  }

  return results.sort();
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "缺少 frontmatter");

  const data = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!kv) {
      continue;
    }
    data[kv[1]] = kv[2].replace(/^['"]|['"]$/g, "");
  }
  return data;
}

function extractRelativeLinks(source) {
  return [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function extractCodeBlocks(source) {
  return [...source.matchAll(/```([a-zA-Z0-9#+-]*)\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1].toLowerCase(),
    code: match[2],
  }));
}

function lintCodeBlock(language, code, label) {
  if (language === "python") {
    const result = spawnSync("python3", ["-c", "import ast,sys; ast.parse(sys.stdin.read())"], {
      encoding: "utf-8",
      input: code,
    });
    assert.equal(result.status, 0, `${label} Python 语法错误：${result.stderr || result.stdout}`);
    return true;
  }

  if (language === "bash" || language === "sh") {
    const result = spawnSync("bash", ["-n"], {
      encoding: "utf-8",
      input: code,
    });
    assert.equal(result.status, 0, `${label} Bash 语法错误：${result.stderr || result.stdout}`);
    return true;
  }

  if (language === "json") {
    assert.doesNotThrow(() => JSON.parse(code), `${label} JSON 语法错误`);
    return true;
  }

  return false;
}

test("README 技能列表与实际目录一致", () => {
  const readme = readFileSync(readmePath, "utf-8");
  const listed = readme
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.match(/\| `([^`]+)` \|/)?.[1])
    .filter(Boolean)
    .sort();

  assert.deepEqual(listed, skillDirs);
});

test("所有 SKILL.md 都采用统一中文结构", () => {
  for (const file of skillFiles) {
    const source = readFileSync(file, "utf-8");
    const frontmatter = parseFrontmatter(source);
    const skillName = basename(dirname(file));

    assert.equal(frontmatter.name, skillName, `${file} 的 frontmatter.name 与目录名不一致`);
    assert.ok(frontmatter.description, `${file} 缺少 frontmatter.description`);

    let previousIndex = -1;
    for (const heading of requiredHeadings) {
      const index = source.indexOf(heading);
      assert.ok(index >= 0, `${file} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${file} 的标题顺序不正确：${heading}`);
      previousIndex = index;
    }

    assert.doesNotMatch(
      source,
      /^## (Overview|Process|Rules|Inputs|Instructions|Output Format|Purpose \/ Overview|When to Use|Operational Workflow|Discovery|Quick Templates|DO \/ DON'T)\b/m,
      `${file} 仍残留旧结构标题`,
    );
  }
});

test("所有 Markdown 相对链接都有效，且没有 TODO/FIXME/HACK/TBD/XXX", () => {
  for (const file of walkMarkdownFiles(pluginRoot)) {
    const source = readFileSync(file, "utf-8");

    assert.doesNotMatch(source, /\b(TODO|FIXME|HACK|TBD|XXX)\b/i, `${file} 仍残留待处理标记`);

    for (const href of extractRelativeLinks(source)) {
      const target = resolve(dirname(file), href);
      assert.ok(target.startsWith(pluginRoot), `${file} 中 ${href} 越界`);
      assert.ok(existsSync(target), `${file} 中交叉引用不存在：${href}`);
    }
  }
});

test("所有 Markdown 中受支持的代码示例都能通过语法检查", () => {
  for (const file of walkMarkdownFiles(pluginRoot)) {
    const codeBlocks = extractCodeBlocks(readFileSync(file, "utf-8"));
    let lintedBlocks = 0;

    codeBlocks.forEach((block, index) => {
      if (lintCodeBlock(block.language, block.code, `${basename(file)}-${index + 1}`)) {
        lintedBlocks += 1;
      }
    });

    if (file.endsWith("SKILL.md")) {
      assert.ok(lintedBlocks > 0, `${file} 没有可校验的代码示例`);
    }
  }
});
