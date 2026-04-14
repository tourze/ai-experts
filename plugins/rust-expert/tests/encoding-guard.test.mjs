import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";

test("encoding-guard 会检查 .env.local 这类多后缀文本文件", async () => {
  const root = mkdtempSync(join(tmpdir(), "rust-encoding-"));
  const filePath = join(root, "service.env.local");

  try {
    writeFileSync(filePath, Buffer.from([0xff, 0xfe, 0x61, 0x00]));

    const result = await runEncodingGuard({
      tool_input: {
        file_path: filePath,
      },
    });

    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-16 LE BOM/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
