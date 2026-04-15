import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { run as runSkillRoutingContext } from "../hooks/session-start/skill-routing-context.mjs";
import { run as runNextStepGate } from "../hooks/stop/next-step-gate.mjs";
import { run as runSkillRoutingReminder } from "../hooks/user-prompt-submit/skill-routing-reminder.mjs";

// ── UserPromptSubmit: skill-routing-reminder ──

test("skill-routing-reminder 对编码任务注入路由提醒", async () => {
  const result = await runSkillRoutingReminder({ prompt: "帮我重构一下这个模块的错误处理" });
  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /Skill Routing Reminder/);
  assert.match(result?.reason ?? "", /📌 Skill 路由/);
});

test("skill-routing-reminder 对短消息放行", async () => {
  const result = await runSkillRoutingReminder({ prompt: "好的" });
  assert.equal(result, null);
});

test("skill-routing-reminder 对斜杠命令放行", async () => {
  const result = await runSkillRoutingReminder({ prompt: "/commit 提交当前改动" });
  assert.equal(result, null);
});

test("skill-routing-reminder 对确认性回复放行", async () => {
  const result = await runSkillRoutingReminder({ prompt: "继续" });
  assert.equal(result, null);
});

// ── SessionStart: skill-routing-context ──

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

test("next-step-gate 在最后消息含 tool_use 时仍能检测前一条文本", async () => {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "turn-mix",
        message: { content: "帮我重构这个模块" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-mix",
        message: {
          content: [
            {
              type: "text",
              text: "重构已完成，所有测试通过。以下是变更摘要：修改了 3 个文件，删除了 2 个冗余函数，提取了 1 个公共模块。代码行数减少了 15%，可读性显著提升。",
            },
          ],
        },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-mix",
        message: {
          content: [
            {
              type: "text",
              text: "让我再确认一下。",
            },
            {
              type: "tool_use",
              id: "tool-1",
              name: "Bash",
              input: { command: "npm test" },
            },
          ],
        },
      }),
    ],
    async (transcriptPath) => {
      const result = await runNextStepGate({ transcript_path: transcriptPath });
      // 最后含文本的 assistant 消息缺少 📌 下一步推荐 → 应 block
      assert.equal(result?.decision, "block");
    },
  );
});

test("next-step-gate 在混合消息含下一步推荐时放行", async () => {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "turn-mix2",
        message: { content: "帮我优化性能" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "turn-mix2",
        message: {
          content: [
            {
              type: "text",
              text: "优化完成。\n\n---\n📌 下一步推荐\n- `testing-expert:benchmark-runner`：跑基准测试验证优化效果 → 对比前后延迟。",
            },
            {
              type: "tool_use",
              id: "tool-2",
              name: "Bash",
              input: { command: "npm run bench" },
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
