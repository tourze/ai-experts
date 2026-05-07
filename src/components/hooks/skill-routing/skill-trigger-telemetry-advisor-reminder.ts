import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { SHORT_CONFIRMATION_RE } from "../_shared/skill-routing-rules";
import {
  readRecentTelemetryEntries,
  recordAuditTelemetry,
  type HookTelemetryEntry,
} from "../_shared/audit-telemetry";

export const skillTriggerTelemetryAdvisorReminderHook = defineHook({
  id: "skill-trigger-telemetry-advisor-reminder",
  description: "基于审计积累提醒使用 trigger-telemetry-advisor。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./skill-trigger-telemetry-advisor-reminder.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * trigger-telemetry-advisor-reminder (UserPromptSubmit)
 *
 * 基于最近真实的 skill 使用审计和 hook telemetry 信号，判断是否应提醒使用
 * trigger-telemetry-advisor。这里故意不按用户 prompt 的语义关键词触发。
 */


const MIN_PROMPT_LENGTH = 8;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const REMINDER_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MIN_SKILL_AUDIT_TURNS = 3;
const MIN_NEW_AUDITS_AFTER_REMINDER = 3;

function sessionKey(entry: HookTelemetryEntry) {
  return entry.session_id || entry.transcript_path || null;
}

function relevantEntriesForPayload(entries: readonly HookTelemetryEntry[], payload: NormalizedHookPayload) {
  const cutoff = Date.now() - LOOKBACK_MS;
  const payloadSessionKey = payload?.sessionId || payload?.transcriptPath || null;
  return entries
    .filter((entry) => typeof entry.ts === "number" && entry.ts >= cutoff)
    .filter((entry) => {
      if (!payloadSessionKey) {
        return true;
      }
      const key = sessionKey(entry);
      return !key || key === payloadSessionKey;
    });
}

function countNewSkillAuditsAfterReminder(skillAudits: readonly HookTelemetryEntry[], lastReminderTs: number | null | undefined) {
  if (!lastReminderTs) {
    return skillAudits.length;
  }
  return skillAudits.filter((entry) => typeof entry.ts === "number" && entry.ts > lastReminderTs).length;
}

function summarizeSignals(entries: readonly HookTelemetryEntry[]) {
  const skillAudits = entries.filter((entry) => entry.audit_type === "skill_usage");
  const lastReminder = entries
    .filter((entry) =>
      (entry.hook === "skill-trigger-telemetry-advisor-reminder" ||
        entry.hook === "trigger-telemetry-advisor-reminder") &&
      entry.decision === "context")
    .sort((left, right) => (right.ts ?? 0) - (left.ts ?? 0))[0];
  const hookErrors = entries.filter((entry) => entry.decision === "error");
  const hookBlocks = entries.filter((entry) => entry.decision === "block");
  const noisyReports = entries.filter((entry) => entry.decision === "report");
  const missingRoutes = skillAudits.filter((entry) => entry.missing_route === true);
  const routedButNotUsed = skillAudits.filter((entry) => entry.routed_but_not_used === true);
  const recommendationOnly = skillAudits.filter((entry) =>
    Array.isArray(entry.skills_recommended) &&
    entry.skills_recommended.length > 0 &&
    (!Array.isArray(entry.skills_used) || entry.skills_used.length === 0),
  );
  const newSkillAudits = countNewSkillAuditsAfterReminder(skillAudits, lastReminder?.ts ?? null);

  return {
    skillAudits,
    lastReminder,
    hookErrors,
    hookBlocks,
    noisyReports,
    missingRoutes,
    routedButNotUsed,
    recommendationOnly,
    newSkillAudits,
  };
}

function shouldSuggestTriggerTelemetryAdvisor(signals: ReturnType<typeof summarizeSignals>) {
  if (signals.lastReminder?.ts !== undefined && Date.now() - signals.lastReminder.ts < REMINDER_COOLDOWN_MS) {
    return false;
  }

  if (signals.skillAudits.length < MIN_SKILL_AUDIT_TURNS) {
    return false;
  }

  if (signals.newSkillAudits < MIN_NEW_AUDITS_AFTER_REMINDER) {
    return false;
  }

  return signals.hookErrors.length > 0 ||
    signals.hookBlocks.length >= 3 ||
    signals.noisyReports.length >= 8 ||
    signals.missingRoutes.length >= 2 ||
    signals.routedButNotUsed.length >= 2 ||
    signals.recommendationOnly.length >= 3 ||
    signals.skillAudits.length >= 8;
}

function buildReason(signals: ReturnType<typeof summarizeSignals>) {
  const facts = [
    `最近已自动审计 ${signals.skillAudits.length} 个 skill 使用回合`,
    `缺少路由声明 ${signals.missingRoutes.length} 次`,
    `命中但未调用 ${signals.routedButNotUsed.length} 次`,
    `只推荐未使用 ${signals.recommendationOnly.length} 次`,
    `hook error ${signals.hookErrors.length} 次`,
    `hook block ${signals.hookBlocks.length} 次`,
    `hook report ${signals.noisyReports.length} 次`,
  ];

  return [
    "[Trigger Telemetry Advisor Reminder]",
    "",
    "最近的自动审计数据已经积累到需要复盘的程度；这不是根据用户当前输入内容判断的，而是根据最近 skill 路由/使用和 hook telemetry 信号判断的。",
    "",
    "观测信号：",
    ...facts.map((fact) => `- ${fact}`),
    "",
    "应优先使用 `trigger-telemetry-advisor skill`，基于当前会话或工作区 telemetry 生成触发治理建议报告。",
    "",
    "建议按三种口径读取 telemetry：当前会话、当前工作区、必要时跨工作区汇总；只引用本机实际存在的 telemetry 文件和 hook 配置。",
    "",
    "最终报告需包含：范围与数据质量、P0/P1/P2 发现、证据、建议改动和验证命令。",
  ].join("\n");
}

export async function run(payload: NormalizedHookPayload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;
  if (trimmed.startsWith("/")) return null;
  if (SHORT_CONFIRMATION_RE.test(trimmed)) return null;

  const entries = relevantEntriesForPayload(readRecentTelemetryEntries(payload), payload);
  const signals = summarizeSignals(entries);
  if (!shouldSuggestTriggerTelemetryAdvisor(signals)) {
    return null;
  }

  recordAuditTelemetry(payload, {
    hook: "skill-trigger-telemetry-advisor-reminder",
    event: "user-prompt-submit",
    decision: "context",
    audit_type: "trigger_telemetry_advisor_reminder",
    skill_audit_count: signals.skillAudits.length,
    missing_route_count: signals.missingRoutes.length,
    routed_but_not_used_count: signals.routedButNotUsed.length,
    recommendation_only_count: signals.recommendationOnly.length,
    hook_error_count: signals.hookErrors.length,
    hook_block_count: signals.hookBlocks.length,
    hook_report_count: signals.noisyReports.length,
  });

  return {
    decision: "context",
    reason: buildReason(signals),
  };
}
