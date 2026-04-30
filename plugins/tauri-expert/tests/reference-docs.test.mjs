import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginReadme = resolve("plugins/tauri-expert/README.md");
const skillReadme = resolve("plugins/tauri-expert/skills/tauri-v2/README.md");
const referencesReadme = resolve("plugins/tauri-expert/skills/tauri-v2/references/README.md");
const capabilityReference = resolve("plugins/tauri-expert/skills/tauri-v2/references/capabilities-reference.md");
const pluginReference = resolve("plugins/tauri-expert/skills/tauri-v2/references/plugin-reference.md");

test("README 与参考文档不再包含已知失效的技能/agent 引用", () => {
  const skillReadmeContent = readFileSync(skillReadme, "utf-8");

  assert.doesNotMatch(skillReadmeContent, /tanstack-start-expert|react-component-architect|go-google-style-expert/);
  assert.doesNotMatch(skillReadmeContent, /tauri-v2-expert\.md/);
});

test("权限文档不再把 capability 规则描述为全局绝对前提", () => {
  const referencesReadmeContent = readFileSync(referencesReadme, "utf-8");
  const capabilityContent = readFileSync(capabilityReference, "utf-8");
  const pluginContent = readFileSync(pluginReference, "utf-8");

  assert.doesNotMatch(referencesReadmeContent, /MUST add to your capabilities/);
  assert.doesNotMatch(capabilityContent, /By default, \*\*nothing is allowed\*\*/);
  assert.doesNotMatch(pluginContent, /Every plugin's permissions must be \*\*explicitly granted\*\* in a capability file/);
  assert.match(pluginContent, /default permission is often added automatically/i);
});

test("Tauri README 暴露校验入口，方便后续自查", () => {
  const content = readFileSync(pluginReadme, "utf-8");
  assert.match(content, /node --test plugins\/tauri-expert\/tests\/\*\.test\.mjs/);
});
