import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildAgentInvocation,
  buildClaudeArgs,
  buildCodexArgs,
  defaultModelForProvider,
  runAgent,
} from "../scripts/agent-runner.mjs";

describe("agent-runner command builders", () => {
  it("构造隔离的 codex exec 参数", () => {
    const args = buildCodexArgs({
      prompt: "检查这个 skill",
      model: "gpt-test",
      cwd: "/tmp/work",
      sandbox: "read-only",
      loadUserConfig: false,
      json: true,
      outputSchemaPath: "/tmp/schema.json",
      outputLastMessagePath: "/tmp/out.json",
    });
    assert.deepEqual(args, [
      "exec",
      "--ephemeral",
      "--skip-git-repo-check",
      "-s",
      "read-only",
      "-C",
      "/tmp/work",
      "-m",
      "gpt-test",
      "--ignore-user-config",
      "--ignore-rules",
      "--json",
      "--output-schema",
      "/tmp/schema.json",
      "-o",
      "/tmp/out.json",
      "检查这个 skill",
    ]);
  });

  it("构造 bare claude -p 参数", () => {
    const args = buildClaudeArgs({
      prompt: "检查这个 skill",
      model: "sonnet",
      loadUserConfig: false,
      outputFormat: "json",
    });
    assert.deepEqual(args, [
      "-p",
      "检查这个 skill",
      "--no-session-persistence",
      "--output-format",
      "json",
      "--model",
      "sonnet",
      "--bare",
      "--disable-slash-commands",
    ]);
  });

  it("provider 默认模型按 CLI 分开", () => {
    assert.equal(defaultModelForProvider("codex"), "gpt-5.4-mini");
    assert.equal(defaultModelForProvider("claude"), "sonnet");
  });

  it("runAgent 使用注入 runner，避免测试中真实调用 CLI", () => {
    const calls = [];
    const result = runAgent({
      provider: "codex",
      prompt: "hello",
      runner(command, args, options) {
        calls.push({ command, args, options });
        return { status: 0, stdout: "ok\n", stderr: "" };
      },
    });
    assert.equal(result.output, "ok");
    assert.equal(calls[0].command, "codex");
    assert.equal(calls[0].options.input, "");
  });

  it("Codex isolateCodexHome 只暴露临时 CODEX_HOME 和 auth.json", () => {
    const tmp = mkdtempSync(join(tmpdir(), "ai-experts-agent-runner-"));
    const sourceHome = join(tmp, "codex-home");
    try {
      mkdirSync(sourceHome);
      writeFileSync(join(sourceHome, "auth.json"), "{}", "utf-8");
      let isolatedHome = null;
      const result = runAgent({
        provider: "codex",
        prompt: "hello",
        isolateCodexHome: true,
        env: { ...process.env, CODEX_HOME: sourceHome },
        runner(_command, _args, options) {
          isolatedHome = options.env.CODEX_HOME;
          assert.notEqual(isolatedHome, sourceHome);
          assert.equal(readlinkSync(join(isolatedHome, "auth.json")), join(sourceHome, "auth.json"));
          return { status: 0, stdout: "ok\n", stderr: "" };
        },
      });
      assert.equal(result.output, "ok");
      assert.equal(existsSync(isolatedHome), false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("buildAgentInvocation 拒绝未知 provider", () => {
    assert.throws(() => buildAgentInvocation({ provider: "other", prompt: "x" }), /unsupported provider/);
  });
});
