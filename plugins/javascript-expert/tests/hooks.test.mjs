import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { run as runLintEslint } from "../hooks/post-tool-use/edit-write/lint-eslint.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "javascript-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function payload(filePath) {
  return { tool_input: { file_path: filePath } };
}

function writeExecutable(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  chmodSync(filePath, 0o755);
}

test("lint-eslint 能在 monorepo 根目录 node_modules/.bin 找到 eslint", async () => {
  await withTempDir(async (dir) => {
    const packageDir = join(dir, "packages", "app");
    const filePath = join(packageDir, "src", "index.js");

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(join(packageDir, "eslint.config.mjs"), "export default [];\n", "utf8");
    writeFileSync(filePath, "const value = 1;\n", "utf8");
    writeExecutable(
      join(dir, "node_modules", ".bin", "eslint"),
      "#!/bin/sh\necho 'mock eslint error' 1>&2\nexit 1\n",
    );

    const result = await runLintEslint(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /mock eslint error/);
  });
});
