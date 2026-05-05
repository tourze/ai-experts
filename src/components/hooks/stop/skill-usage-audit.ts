import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { existsSync } from "node:fs";
import {
  findCurrentCodexUserIndex,
  findCurrentPromptId,
  getFinalAssistantText,
  getFinalCodexAssistantText,
  parseTranscript,
} from "../_shared/transcript-utils.mjs";
import {
  hasCompletionStatus,
  shouldSkipNextStepRequirement,
} from "../_shared/skill-routing-rules.mjs";
import { recordAuditTelemetry } from "../_shared/audit-telemetry.mjs";

export const skillUsageAuditHook = defineHook({
  id: "skill-usage-audit",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.Stop,
  entry: new URL("./skill-usage-audit.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * skill-usage-audit (Stop)
 *
 * 自动把当前轮的 skill 路由声明、已调用/未调用、下一步推荐写入
 * hook telemetry，供后续 trigger-telemetry-advisor 基于真实使用情况给建议。
 */

const SKILL_TOKEN_RE = /`([A-Za-z0-9_.-]+(?::[A-Za-z0-9_.-]+)?)`/g;

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function without(values, excluded) {
  const excludedSet = new Set(excluded);
  return values.filter((value) => !excludedSet.has(value));
}

function extractSkillTokens(text) {
  return unique([...text.matchAll(SKILL_TOKEN_RE)].map((match) => match[1]));
}

function extractSection(text, startRe) {
  const start = text.search(startRe);
  if (start < 0) {
    return "";
  }
  const rest = text.slice(start);
  const next = rest.slice(1).search(/\n(?:\s*\n|---|#{1,6}\s|📌\s+)/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}

function extractLineSkills(text, lineRe) {
  return unique(
    text
      .split("\n")
      .filter((line) => lineRe.test(line))
      .flatMap((line) => extractSkillTokens(line)),
  );
}

function summarizeSkillUsage(finalText) {
  const routingSection = extractSection(
    finalText,
    /📌\s*(?:Skill 路由|本轮未命中 skill)/,
  );
  const nextStepSection = extractSection(finalText, /📌\s*下一步推荐/);
  const hasRoutingDeclaration = /📌\s*(?:Skill 路由|本轮未命中 skill)/.test(
    finalText,
  );
  const noSkillHit = /📌\s*本轮未命中 skill/.test(finalText);

  const routed = extractLineSkills(routingSection, /命中|已命中/);
  const usedFromLines = extractLineSkills(
    routingSection,
    /已调用|实际加载|通过 Skill tool/,
  );
  const skipped = extractLineSkills(routingSection, /跳过|未调用/);
  const used =
    usedFromLines.length > 0 ? usedFromLines : without(routed, skipped);
  const recommended = extractSkillTokens(nextStepSection);
  const missingRoute =
    !hasRoutingDeclaration &&
    !shouldSkipNextStepRequirement(finalText) &&
    !hasCompletionStatus(finalText);

  return {
    hasRoutingDeclaration,
    noSkillHit,
    missingRoute,
    routed,
    used,
    skipped,
    recommended,
    routedButNotUsed:
      routed.length > 0 && used.length === 0 && skipped.length > 0,
  };
}

export async function run(payload) {
  if (payload?.stop_hook_active) {
    return null;
  }

  const transcriptPath = payload?.transcript_path;
  if (
    typeof transcriptPath !== "string" ||
    !transcriptPath ||
    !existsSync(transcriptPath)
  ) {
    return null;
  }

  const records = parseTranscript(transcriptPath);
  if (!records?.length) {
    return null;
  }

  const promptId = findCurrentPromptId(records);
  const codexUserIndex = promptId ? -1 : findCurrentCodexUserIndex(records);
  if (!promptId && codexUserIndex < 0) {
    return null;
  }

  const finalText = promptId
    ? getFinalAssistantText(records, promptId)
    : getFinalCodexAssistantText(records, codexUserIndex);
  if (!finalText) {
    return null;
  }

  const summary = summarizeSkillUsage(finalText);
  recordAuditTelemetry(payload, {
    hook: "skill-usage-audit.mjs",
    event: "stop",
    decision: "audit",
    audit_type: "skill_usage",
    prompt_id: promptId ?? null,
    transcript_format: promptId ? "claude" : "codex",
    has_routing_declaration: summary.hasRoutingDeclaration,
    no_skill_hit: summary.noSkillHit,
    missing_route: summary.missingRoute,
    routed_but_not_used: summary.routedButNotUsed,
    skills_routed: summary.routed,
    skills_used: summary.used,
    skills_skipped: summary.skipped,
    skills_recommended: summary.recommended,
    detail: summary.missingRoute
      ? "assistant response lacks skill routing declaration"
      : null,
    duration_ms: null,
  });

  return null;
}
