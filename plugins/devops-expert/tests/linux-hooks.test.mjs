import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runLintShellcheck } from "../hooks/post-tool-use/edit-write/lint-shellcheck.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "linux-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function filePayload(filePath) {
  return { tool_input: { file_path: filePath } };
}

test("lint-shellcheck 会阻止缺少 set -euo pipefail 的新脚本", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "deploy.sh");
    writeFileSync(filePath, "#!/usr/bin/env bash\necho ok\n", "utf-8");

    const result = await runLintShellcheck(filePayload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /set -euo pipefail/);
  });
});
