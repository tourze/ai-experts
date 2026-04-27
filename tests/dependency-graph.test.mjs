import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGINS_DIR = join(ROOT, "plugins");
const README = join(ROOT, "README.md");

const SECTION_HEADING = "## 已声明的插件依赖";

function parseDependencyDeclarations() {
  const text = readFileSync(README, "utf8");
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith(SECTION_HEADING));
  if (start === -1) {
    throw new Error(`README.md 中未找到 \"${SECTION_HEADING}\" 段落`);
  }

  const declarations = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) continue;
    const match = trimmed.match(/^- ([\w-]+) → (.+)$/);
    if (!match) continue;
    declarations.push({
      plugin: match[1],
      deps: match[2].split(",").map((s) => s.trim()).filter(Boolean),
    });
  }
  return declarations;
}

const declarations = parseDependencyDeclarations();

function isPluginDir(name) {
  const path = join(PLUGINS_DIR, name);
  return existsSync(path) && statSync(path).isDirectory();
}

test("解析依赖段落至少识别到一条声明（防止格式漂移导致测试空过）", () => {
  assert.ok(
    declarations.length > 0,
    "未解析到任何依赖声明；可能 README 段落格式已变更，请同步本测试的解析逻辑"
  );
});

test("依赖声明里每个源插件都存在于 plugins/", () => {
  for (const { plugin } of declarations) {
    assert.ok(
      isPluginDir(plugin),
      `依赖声明里的源插件 ${plugin} 不存在于 plugins/`
    );
  }
});

test("依赖声明里每个目标插件都存在于 plugins/", () => {
  for (const { plugin, deps } of declarations) {
    for (const dep of deps) {
      assert.ok(
        isPluginDir(dep),
        `${plugin} 声明依赖 ${dep}，但 plugins/${dep}/ 不存在`
      );
    }
  }
});

test("依赖关系无自指（不会出现 X → X）", () => {
  for (const { plugin, deps } of declarations) {
    assert.ok(
      !deps.includes(plugin),
      `${plugin} 声明依赖了自身`
    );
  }
});
