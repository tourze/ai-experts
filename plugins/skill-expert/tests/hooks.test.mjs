import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { readRecentTelemetryEntries } from "../hooks/_shared/audit-telemetry.mjs";
import { run as runSkillRoutingContext } from "../hooks/session-start/skill-routing-context.mjs";
import { run as runNextStepGate } from "../hooks/stop/next-step-gate.mjs";
import { run as runSkillUsageAudit } from "../hooks/stop/skill-usage-audit.mjs";
import { run as runSkillRoutingReminder } from "../hooks/user-prompt-submit/skill-routing-reminder.mjs";
import { run as runTriggerTelemetryAdvisorReminder } from "../hooks/user-prompt-submit/trigger-telemetry-advisor-reminder.mjs";

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

async function withTelemetryDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "skill-expert-telemetry-"));
  const previousDir = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR;
  const previousWorkspace = process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;
  process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR = dir;
  process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE = join(dir, "workspace");

  try {
    return await fn({
      dir,
      payload: {
        cwd: process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE,
        session_id: "test-session",
      },
    });
  } finally {
    if (previousDir === undefined) {
      delete process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR;
    } else {
      process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR = previousDir;
    }
    if (previousWorkspace === undefined) {
      delete process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;
    } else {
      process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE = previousWorkspace;
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

async function writeAuditedStopTurn(payload, assistantText) {
  await withTranscript(
    [
      JSON.stringify({
        type: "user",
        promptId: "audit-turn",
        message: { content: "请处理这个任务" },
      }),
      JSON.stringify({
        type: "assistant",
        promptId: "audit-turn",
        message: {
          content: [
            {
              type: "text",
              text: assistantText,
            },
          ],
        },
      }),
    ],
    async (transcriptPath) => {
      await runSkillUsageAudit({ ...payload, transcript_path: transcriptPath });
    },
  );
}

test("skill-usage-audit 自动记录当前轮 skill 路由使用情况", async () => {
  await withTelemetryDir(async ({ payload }) => {
    await writeAuditedStopTurn(
      payload,
      [
        "📌 Skill 路由",
        "- 命中：`skill-expert:skill-activation-analyzer`（诊断路由）",
        "- 触发方式：上下文自动匹配，已调用",
        "",
        "分析完成。",
        "",
        "---",
        "📌 下一步推荐",
        "- `skill-expert:trigger-telemetry-advisor`：生成审计建议报告。",
      ].join("\n"),
    );

    const entries = readRecentTelemetryEntries(payload);
    const audit = entries.find((entry) => entry.audit_type === "skill_usage");
    assert.equal(audit?.decision, "audit");
    assert.deepEqual(audit?.skills_routed, ["skill-expert:skill-activation-analyzer"]);
    assert.deepEqual(audit?.skills_used, ["skill-expert:skill-activation-analyzer"]);
    assert.deepEqual(audit?.skills_recommended, ["skill-expert:trigger-telemetry-advisor"]);
  });
});

test("skill-usage-audit 支持 Codex response_item transcript 格式", async () => {
  await withTelemetryDir(async ({ payload }) => {
    await withTranscript(
      [
        JSON.stringify({
          type: "response_item",
          payload: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "继续做 telemetry 精修" }],
          },
        }),
        JSON.stringify({
          type: "response_item",
          payload: {
            type: "message",
            role: "assistant",
            phase: "commentary",
            content: [
              {
                type: "output_text",
                text: "📌 Skill 路由：命中 `skill-expert:trigger-telemetry-advisor`（分析 telemetry）和 `skill-expert:skill-activation-analyzer`（诊断触发行为）。",
              },
            ],
          },
        }),
        JSON.stringify({
          type: "response_item",
          payload: {
            type: "message",
            role: "assistant",
            phase: "final_answer",
            content: [
              {
                type: "output_text",
                text: "已完成分析。\n\n📌 下一步推荐\n- `skill-expert:trigger-telemetry-advisor`：继续复盘真实 telemetry。",
              },
            ],
          },
        }),
      ],
      async (transcriptPath) => {
        await runSkillUsageAudit({ ...payload, transcript_path: transcriptPath });
      },
    );

    const entries = readRecentTelemetryEntries(payload);
    const audit = entries.find((entry) => entry.audit_type === "skill_usage");
    assert.equal(audit?.decision, "audit");
    assert.equal(audit?.transcript_format, "codex");
    assert.deepEqual(audit?.skills_routed, [
      "skill-expert:skill-activation-analyzer",
      "skill-expert:trigger-telemetry-advisor",
    ]);
    assert.deepEqual(audit?.skills_used, [
      "skill-expert:skill-activation-analyzer",
      "skill-expert:trigger-telemetry-advisor",
    ]);
    assert.equal(audit?.routed_but_not_used, false);
  });
});

test("trigger-telemetry-advisor-reminder 基于最近 skill 审计信号触发，不依赖用户输入内容", async () => {
  await withTelemetryDir(async ({ payload }) => {
    for (let index = 0; index < 3; index += 1) {
      await writeAuditedStopTurn(
        payload,
        "我完成了这次改动，但没有输出 skill 路由声明。\n\n---\n📌 下一步推荐\n- 本轮无推荐，原因：当前任务已闭合。",
      );
    }

    const result = await runTriggerTelemetryAdvisorReminder({
      ...payload,
      prompt: "继续推进这个任务",
    });

    assert.equal(result?.decision, "context");
    assert.match(result?.reason ?? "", /最近的自动审计数据/);
    assert.match(result?.reason ?? "", /缺少路由声明 3 次/);
    assert.match(result?.reason ?? "", /skill-expert:trigger-telemetry-advisor/);
  });
});

test("trigger-telemetry-advisor-reminder 没有足够自动审计数据时不触发", async () => {
  await withTelemetryDir(async ({ payload }) => {
    const result = await runTriggerTelemetryAdvisorReminder({
      ...payload,
      prompt: "根据当前目录的 decisions.jsonl telemetry 给我一份 hooks/skill 触发治理建议报告",
    });

    assert.equal(result, null);
  });
});

test("trigger-telemetry-advisor-reminder 不抢普通 skill 创建请求", async () => {
  const result = await runTriggerTelemetryAdvisorReminder({
    prompt: "帮我创建一个新的 SwiftUI skill，说明什么时候触发",
  });

  assert.equal(result, null);
});

test("trigger-telemetry-advisor-reminder 不抢普通 git 统计请求", async () => {
  const result = await runTriggerTelemetryAdvisorReminder({
    prompt: "统计这个仓库最近一周每个作者改了什么",
  });

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
