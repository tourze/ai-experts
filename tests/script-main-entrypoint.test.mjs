import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(".");
const SCAN_DIRS = ["plugins", "scripts"];

const SYMLINK_SENSITIVE_MAIN_PATTERNS = [
  /import\.meta\.url\s*===\s*pathToFileURL\(process\.argv\[1\]\)\.href/,
  /pathToFileURL\(process\.argv\[1\]\)\.href\s*===\s*import\.meta\.url/,
  /resolve\(process\.argv\[1\]\)\s*===\s*fileURLToPath\(import\.meta\.url\)/,
  /fileURLToPath\(import\.meta\.url\)\s*===\s*resolve\(process\.argv\[1\]\)/,
];

function listMjsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...listMjsFiles(path));
    else if (entry.endsWith(".mjs")) files.push(path);
  }
  return files;
}

test("CLI main 判断必须解析 symlink 后比较真实路径", () => {
  const offenders = [];

  for (const dir of SCAN_DIRS) {
    for (const file of listMjsFiles(join(ROOT, dir))) {
      const source = readFileSync(file, "utf8");
      if (SYMLINK_SENSITIVE_MAIN_PATTERNS.some((pattern) => pattern.test(source))) {
        offenders.push(relative(ROOT, file));
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    [
      "发现 symlink 敏感的 ESM main 判断。",
      "skill 脚本经 ~/.claude/skills 或 ~/.codex/skills symlink 执行时，process.argv[1] 是 symlink 路径，import.meta.url 是真实路径。",
      "请改用 realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)。",
      ...offenders,
    ].join("\n"),
  );
});
