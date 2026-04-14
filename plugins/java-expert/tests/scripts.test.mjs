import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const pluginRoot = resolve("plugins/java-expert");
const mainScript = resolve(pluginRoot, "skills/java-expert/scripts/main.cjs");
const { preExecute } = require("../skills/java-expert/hooks/pre-execute.cjs");
const { postExecute } = require("../skills/java-expert/hooks/post-execute.cjs");

test("main.cjs --help 输出帮助信息", () => {
  const result = spawnSync("node", [mainScript, "--help"], {
    cwd: resolve("."),
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /用法：/);
});

test("main.cjs --list 输出技能入口", () => {
  const result = spawnSync("node", [mainScript, "--list"], {
    cwd: resolve("."),
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /java-expert/);
});

test("preExecute 会拒绝非对象 context", () => {
  assert.deepEqual(preExecute("bad-context"), {
    allow: false,
    message: "java-expert: context 必须为对象或为空",
  });
});

test("postExecute 返回稳定摘要", () => {
  assert.deepEqual(postExecute({ target: "demo" }), {
    ok: true,
    skill: "java-expert",
    hasContext: true,
  });
});
