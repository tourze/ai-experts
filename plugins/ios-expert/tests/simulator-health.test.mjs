import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const script = resolve("plugins/ios-expert/skills/ios-simulator-skill/scripts/sim_health_check.mjs");
const scriptsDir = resolve("plugins/ios-expert/skills/ios-simulator-skill/scripts");

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

test("simctl Node lifecycle scripts 通过语法检查", () => {
  for (const name of [
    "simctl_boot.mjs",
    "simctl_common.mjs",
    "simctl_create.mjs",
    "simctl_delete.mjs",
    "simctl_erase.mjs",
    "simctl_shutdown.mjs",
  ]) {
    const result = spawnSync(process.execPath, ["--check", resolve(scriptsDir, name)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  }
});

test("simctl Node lifecycle scripts 输出帮助信息", () => {
  for (const [name, pattern] of [
    ["simctl_boot.mjs", /Boot iOS simulators/],
    ["simctl_create.mjs", /Create iOS simulators/],
    ["simctl_delete.mjs", /Delete iOS simulators/],
    ["simctl_erase.mjs", /Erase iOS simulators/],
    ["simctl_shutdown.mjs", /Shutdown iOS simulators/],
  ]) {
    const result = spawnSync(process.execPath, [resolve(scriptsDir, name), "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    assert.match(result.stdout, pattern);
  }
});

test("simctl Node helpers 保持解析和参数转换", async () => {
  const common = await import(resolve(scriptsDir, "simctl_common.mjs"));
  const boot = await import(resolve(scriptsDir, "simctl_boot.mjs"));
  const create = await import(resolve(scriptsDir, "simctl_create.mjs"));
  const deleteScript = await import(resolve(scriptsDir, "simctl_delete.mjs"));

  assert.deepEqual(common.buildSimctlCommand("launch", null, "com.example.app"), [
    "xcrun",
    "simctl",
    "launch",
    "booted",
    "com.example.app",
  ]);
  assert.equal(
    common.parseBootedDeviceUdid("    iPhone 16 Pro (A1B2C3D4-E5F6-7890-ABCD-EF1234567890) (Booted)\n"),
    "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
  );

  const simulators = common.parseSimulatorsFromList({
    devices: {
      "iOS 18.0": [
        { name: "iPhone 16 Pro", udid: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE", state: "Booted" },
        { name: "iPad Air", udid: "11111111-2222-3333-4444-555555555555", state: "Shutdown" },
      ],
    },
  });
  assert.equal(simulators[0].type, "iPhone");
  assert.deepEqual(common.filterSimulatorsByState(simulators, "available").map((sim) => sim.name), ["iPad Air"]);
  assert.equal(common.resolveDeviceIdentifier("iPhone 16", simulators, null), "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE");
  assert.equal(common.resolveDeviceIdentifier("booted", simulators, "BOOTED-UDID"), "BOOTED-UDID");

  assert.deepEqual(create.parseDeviceTypes({ devicetypes: [{ name: "iPhone 16 Pro", identifier: "com.apple.iPhone" }] }), [
    { name: "iPhone 16 Pro", identifier: "com.apple.iPhone" },
  ]);
  assert.deepEqual(
    create.parseRuntimes({
      runtimes: [
        { name: "watchOS 11", identifier: "com.apple.CoreSimulator.SimRuntime.watchOS-11-0" },
        { name: "iOS 18.0", identifier: "com.apple.CoreSimulator.SimRuntime.iOS-18-0" },
      ],
    }),
    [{ name: "iOS 18.0", identifier: "com.apple.CoreSimulator.SimRuntime.iOS-18-0" }],
  );
  assert.equal(boot.parseArgs(["--name", "iPhone 16 Pro", "--wait-ready"]).waitReady, true);
  assert.deepEqual(deleteScript.parseArgs(["--old", "3", "--yes"]), {
    udid: null,
    name: null,
    yes: true,
    all: false,
    type: null,
    old: 3,
    json: false,
    help: false,
  });
});
