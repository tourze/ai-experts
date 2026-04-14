import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { run as runPluginSanity } from "../hooks/session-start/plugin-sanity.mjs";
import { run as runSkillRoutingContext } from "../hooks/session-start/skill-routing-context.mjs";
import { run as runNextStepGate } from "../hooks/stop/next-step-gate.mjs";

test("plugin-sanity 在当前插件结构正确时不报告问题", async () => {
  const result = await runPluginSanity();
  assert.equal(result, null);
});

test("skill-routing-context 会注入 Skill 路由声明要求", async () => {
  const result = await runSkillRoutingContext();
  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /📌 Skill 路由/);
  assert.match(result?.reason ?? "", /第 1 步：扫描当前任务关键词/);
});

async function withTranscript(lines, fn) {
  const dir = mkdtempSync(join(tmpdir(), "skill-expert-stop-"));
  const transcriptPath = join(dir, "session.jsonl");
  writeFileSync(transcriptPath, `${lines.join("\n")}\n`, "utf-8");

  try {
    return await fn(transcriptPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("next-step-gate 在缺少下一步推荐区块时阻断 Stop", async () => {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "turn-1",
        message: { content: "请总结这个 skill 插件的改动并给出结论" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-1",
        message: {
          content: [
            {
              type: "text",
              text: "我已经完成 skill-expert 的 hooks 改造，并补齐了验证与测试。当前实现包括 SessionStart 注入和 Stop gate，行为已经稳定。",
            },
          ],
        },
      }),
    ],
    async (transcriptPath) => {
      const result = await runNextStepGate({ transcript_path: transcriptPath });
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /📌 下一步推荐/);
      assert.match(result?.reason ?? "", /当前最终回复缺少固定的“下一步推荐”区块/);
    },
  );
});

test("next-step-gate 在已有下一步推荐区块时放行", async () => {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "turn-2",
        message: { content: "请给我一个完整收尾" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-2",
        message: {
          content: [
            {
              type: "text",
              text: "改动已完成。\n\n---\n📌 下一步推荐\n- 本轮无推荐，原因：当前任务已闭合。",
            },
          ],
        },
      }),
    ],
    async (transcriptPath) => {
      const result = await runNextStepGate({ transcript_path: transcriptPath });
      assert.equal(result, null);
    },
  );
});

test("next-step-gate 对简短确认类回复放行", async () => {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "turn-3",
        message: { content: "继续" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-3",
        message: {
          content: [
            {
              type: "text",
              text: "好的",
            },
          ],
        },
      }),
    ],
    async (transcriptPath) => {
      const result = await runNextStepGate({ transcript_path: transcriptPath });
      assert.equal(result, null);
    },
  );
});

test("next-step-gate 在 stop_hook_active 时直接放行", async () => {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "turn-4",
        message: { content: "请继续完善" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-4",
        message: {
          content: [
            {
              type: "text",
              text: "这里是一段足够长、足够具体、看起来像任务收尾但还没有附加下一步推荐区块的说明，因此第一次 Stop 应该会被拦下。",
            },
          ],
        },
      }),
    ],
    async (transcriptPath) => {
      const result = await runNextStepGate({ transcript_path: transcriptPath, stop_hook_active: true });
      assert.equal(result, null);
    },
  );
});
