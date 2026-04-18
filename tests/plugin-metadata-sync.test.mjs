import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("sync-plugin-metadata 脚本校验通过", () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["scripts/sync-plugin-metadata.mjs", "--check"], {
      encoding: "utf-8",
      stdio: "pipe",
    });
  });
});
