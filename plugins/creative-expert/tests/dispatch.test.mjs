import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const dispatchPath = resolve("plugins/creative-expert/hooks/dispatch.mjs");

test("dispatch 在空 stdin 下不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
});

