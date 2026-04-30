import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/windows-expert");
const nodeScripts = [
  "skills/prlctl-vm-control/scripts/prlctl_helper.mjs",
  "skills/prlctl-vm-control/scripts/powershell_output.mjs",
];

test("所有 Node 脚本都能通过语法检查", () => {
  for (const relativePath of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
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
