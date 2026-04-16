import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/microsoft-expert");
const dispatchSource = resolve(pluginRoot, "hooks/dispatch.mjs");

function withTempDispatch(fn) {
  const root = mkdtempSync(join(tmpdir(), "microsoft-dispatch-"));
  const hooksRoot = join(root, "hooks");
  mkdirSync(hooksRoot, { recursive: true });
  writeFileSync(join(hooksRoot, "dispatch.mjs"), readFileSync(dispatchSource, "utf-8"));

  try {
    return fn(hooksRoot);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("dispatch 对不存在的 hook 子目录直接退出", () => {
  withTempDispatch((hooksRoot) => {
    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "not-found"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  });
});

test("dispatch 在空 stdin 下不崩溃", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "session-start");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "noop.mjs"), "export async function run() { return null; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "session-start"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  });
});
