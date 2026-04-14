import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/windows-expert");
const nodeScripts = [
  "hooks/dispatch.mjs",
  "hooks/session-start/plugin-sanity.mjs",
];
const pythonScripts = [
  "skills/prlctl-vm-control/scripts/prlctl_helper.py",
];

test("所有 Node 脚本都能通过语法检查", () => {
  for (const relativePath of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
  }
});

test("所有 Python 脚本都能通过 py_compile", () => {
  const pycacheRoot = mkdtempSync(join(tmpdir(), "windows-expert-pycache-"));
  const result = spawnSync("python3", ["-m", "py_compile", ...pythonScripts.map((path) => resolve(pluginRoot, path))], {
    encoding: "utf-8",
    env: {
      ...process.env,
      PYTHONPYCACHEPREFIX: pycacheRoot,
    },
  });

  try {
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(pycacheRoot, { recursive: true, force: true });
  }
});

test("openai agent 配置包含最小必要字段", () => {
  const source = readFileSync(
    resolve(pluginRoot, "skills/prlctl-vm-control/agents/openai.yaml"),
    "utf-8",
  );

  assert.match(source, /^interface:\s*$/m);
  assert.match(source, /^\s{2}display_name:\s*".+"$/m);
  assert.match(source, /^\s{2}short_description:\s*".+"$/m);
  assert.match(source, /^\s{2}default_prompt:\s*".+"$/m);
});
