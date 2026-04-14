import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { findGodotProjectRoot, run } from "../hooks/session-start/dependency-check.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "godot-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeExecutable(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  chmodSync(filePath, 0o755);
}

async function withEnv(updates, fn) {
  const previous = {};

  for (const [key, value] of Object.entries(updates)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("findGodotProjectRoot 会沿父目录向上查找 project.godot", async () => {
  await withTempDir(async (dir) => {
    const projectRoot = join(dir, "game");
    const nestedDir = join(projectRoot, "scenes", "ui");

    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(projectRoot, "project.godot"), "[application]\nconfig/name=\"demo\"\n", "utf8");

    assert.equal(findGodotProjectRoot(nestedDir), projectRoot);
  });
});

test("dependency-check 在非 Godot 项目时不报告可选依赖", async () => {
  await withTempDir(async (dir) => {
    const binDir = join(dir, "bin");
    mkdirSync(binDir, { recursive: true });

    await withEnv({ PATH: binDir, PWD: dir }, async () => {
      const originalCwd = process.cwd();
      process.chdir(dir);
      try {
        assert.equal(await run(), null);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});

test("dependency-check 在 Godot 项目里缺少 godot 命令时返回 report", async () => {
  await withTempDir(async (dir) => {
    const projectRoot = join(dir, "game");
    const binDir = join(dir, "bin");

    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(binDir, { recursive: true });
    writeFileSync(join(projectRoot, "project.godot"), "[application]\nconfig/name=\"demo\"\n", "utf8");

    await withEnv({ PATH: binDir, PWD: projectRoot }, async () => {
      const originalCwd = process.cwd();
      process.chdir(projectRoot);
      try {
        const result = await run();
        assert.equal(result?.decision, "report");
        assert.match(result?.reason ?? "", /godot4 \| godot/);
        assert.match(result?.reason ?? "", /Godot 项目/);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});

test("dependency-check 在 Godot 工程且工具链齐全时返回 null", async () => {
  await withTempDir(async (dir) => {
    const projectRoot = join(dir, "game");
    const binDir = join(dir, "bin");
    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(binDir, { recursive: true });
    writeFileSync(join(projectRoot, "project.godot"), "[application]\nconfig/name=\"demo\"\n", "utf8");
    writeExecutable(join(binDir, "godot4"), "#!/bin/sh\nexit 0\n");
    writeExecutable(join(binDir, "gdformat"), "#!/bin/sh\nexit 0\n");

    await withEnv({ PATH: binDir, PWD: projectRoot }, async () => {
      const originalCwd = process.cwd();
      process.chdir(projectRoot);
      try {
        assert.equal(await run(), null);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
