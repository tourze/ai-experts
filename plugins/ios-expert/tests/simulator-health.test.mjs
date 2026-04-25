import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const script = resolve("plugins/ios-expert/skills/ios-simulator-skill/scripts/sim_health_check.mjs");

test("sim_health_check.mjs 通过语法检查", () => {
  const result = spawnSync(process.execPath, ["--check", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("sim_health_check.mjs 输出帮助信息", () => {
  const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /iOS Simulator Testing - Environment Health Check/);
  assert.match(result.stdout, /Usage: node scripts\/sim_health_check\.mjs/);
});

test("sim_health_check.mjs 缺少工具时返回失败", () => {
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, PATH: "" },
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /iOS Simulator Testing - Environment Health Check/);
  assert.match(result.stdout, /Action required/);
});
