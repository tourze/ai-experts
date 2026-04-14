import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/python-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const requiredSections = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];
const placeholderPattern = /\b(TODO|FIXME|TBD|HACK|XXX)\b/;

function getSkillFiles() {
  return readdirSync(skillsRoot)
    .map((name) => resolve(skillsRoot, name, "SKILL.md"))
    .filter((file) => existsSync(file));
}

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function extractCodeBlocks(markdown) {
  return [...markdown.matchAll(/```([a-zA-Z0-9#+-]*)\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1].toLowerCase(),
    code: match[2],
  }));
}

function lintCodeBlock(tempDir, language, code, label) {
  if (language === "python") {
    const result = spawnSync("python3", ["-c", "import ast,sys; ast.parse(sys.stdin.read())"], {
      encoding: "utf-8",
      input: code,
    });
    assert.equal(result.status, 0, `${label} Python 语法错误：${result.stderr || result.stdout}`);
    return true;
  }

  if (language === "bash" || language === "sh") {
    const filePath = join(tempDir, `${label}.sh`);
    writeFileSync(filePath, code, "utf8");
    const result = spawnSync("bash", ["-n", filePath], { encoding: "utf-8" });
    assert.equal(result.status, 0, `${label} Bash 语法错误：${result.stderr || result.stdout}`);
    return true;
  }

  if (language === "json") {
    assert.doesNotThrow(() => JSON.parse(code), `${label} JSON 语法错误`);
    return true;
  }

  return false;
}

test("SKILL 文档采用统一中文结构并消除占位符", () => {
  for (const file of getSkillFiles()) {
    const markdown = readFileSync(file, "utf-8");
    let previousIndex = -1;

    for (const heading of requiredSections) {
      const index = markdown.indexOf(heading);
      assert.notEqual(index, -1, `${file} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${file} 中 ${heading} 顺序错误`);
      previousIndex = index;
    }

    assert.doesNotMatch(markdown, placeholderPattern, `${file} 存在遗留占位符`);

    const nameMatch = markdown.match(/^name:\s*([^\n]+)$/m);
    const descriptionMatch = markdown.match(/^description:\s*([^\n]+)$/m);
    assert.ok(nameMatch, `${file} 缺少 frontmatter.name`);
    assert.ok(descriptionMatch, `${file} 缺少 frontmatter.description`);
    assert.equal(nameMatch[1].trim(), basename(dirname(file)), `${file} 的 frontmatter.name 与目录名不一致`);
  }
});

test("SKILL 文档中的相对链接都能解析到真实文件", () => {
  for (const file of getSkillFiles()) {
    const markdown = readFileSync(file, "utf-8");
    for (const href of extractRelativeLinks(markdown)) {
      const target = resolve(dirname(file), href);
      assert.ok(target.startsWith(pluginRoot), `${file} 中 ${href} 越界`);
      assert.ok(existsSync(target), `${file} 中交叉引用不存在：${href}`);
      assert.ok(readFileSync(target, "utf-8").length > 0, `${file} 中交叉引用为空：${href}`);
    }
  }
});

test("SKILL 文档中的代码示例通过语法校验", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "python-expert-skill-"));

  try {
    for (const file of getSkillFiles()) {
      const codeBlocks = extractCodeBlocks(readFileSync(file, "utf-8"));
      assert.ok(codeBlocks.length > 0, `${file} 缺少代码示例`);

      let lintedBlocks = 0;
      codeBlocks.forEach((block, index) => {
        if (lintCodeBlock(tempDir, block.language, block.code, `${basename(dirname(file))}-${index + 1}`)) {
          lintedBlocks += 1;
        }
      });

      assert.ok(lintedBlocks > 0, `${file} 没有可校验的代码示例`);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
