/**
 * skill-usage-audit (Stop)
 *
 * 自动把当前轮的 skill 路由声明、已调用/未调用、下一步推荐写入
 * hook telemetry，供后续 trigger-telemetry-advisor 基于真实使用情况给建议。
 */

import { existsSync, readFileSync } from "node:fs";

import {
  hasCompletionStatus,
  shouldSkipNextStepRequirement,
} from "../_shared/skill-routing-rules.mjs";
import { recordAuditTelemetry } from "../_shared/audit-telemetry.mjs";

const SKILL_TOKEN_RE = /`([A-Za-z0-9_.-]+(?::[A-Za-z0-9_.-]+)?)`/g;

function parseTranscript(path) {
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    return null;
  }

  const records = [];
  for (const line of content.split("\n")) {
    if (!line) {
      continue;
    }
    try {
      records.push(JSON.parse(line));
    } catch {
      // Skip damaged tail lines.
    }
  }
  return records;
}

function isToolResultUserRecord(record) {
  if (record?.type !== "user") {
    return false;
  }

  const content = record.message?.content;
  if (typeof content === "string") {
    return false;
  }
  if (!Array.isArray(content)) {
    return false;
  }
  return content.some((item) => item && typeof item === "object" && "tool_use_id" in item);
}

function findCurrentPromptId(records) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (record?.isSidechain === true) {
      continue;
    }
    if (!record?.promptId || record.type !== "user") {
      continue;
    }
    if (isToolResultUserRecord(record)) {
      continue;
    }
    return record.promptId;
  }
  return null;
}

function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function getFinalAssistantText(records, promptId) {
  const texts = [];
  for (const record of records) {
    if (record?.promptId !== promptId || record?.isSidechain === true || record?.type !== "assistant") {
      continue;
    }
    const text = extractTextContent(record.message?.content).trim();
    if (text) {
      texts.push(text);
    }
  }
  return texts.join("\n");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
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
  const next = rest.slice(1).search(/\n(?:---|#{1,6}\s|📌\s+)/);
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
  const routingSection = extractSection(finalText, /📌\s*(?:Skill 路由|本轮未命中 skill)/);
  const nextStepSection = extractSection(finalText, /📌\s*下一步推荐/);
  const hasRoutingDeclaration = /📌\s*(?:Skill 路由|本轮未命中 skill)/.test(finalText);
  const noSkillHit = /📌\s*本轮未命中 skill/.test(finalText);

  const routed = extractLineSkills(routingSection, /命中|已命中/);
  const usedFromLines = extractLineSkills(routingSection, /已调用|实际加载|通过 Skill tool/);
  const used = usedFromLines.length > 0 || !/已调用|实际加载|通过 Skill tool/.test(routingSection)
    ? usedFromLines
    : routed;
  const skipped = extractLineSkills(routingSection, /跳过|未调用/);
  const recommended = extractSkillTokens(nextStepSection);
  const missingRoute = !hasRoutingDeclaration &&
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
    routedButNotUsed: routed.length > 0 && used.length === 0,
  };
}

export async function run(payload) {
  if (payload?.stop_hook_active) {
    return null;
  }

  const transcriptPath = payload?.transcript_path;
  if (typeof transcriptPath !== "string" || !transcriptPath || !existsSync(transcriptPath)) {
    return null;
  }

  const records = parseTranscript(transcriptPath);
  if (!records?.length) {
    return null;
  }

  const promptId = findCurrentPromptId(records);
  if (!promptId) {
    return null;
  }

  const finalText = getFinalAssistantText(records, promptId);
  if (!finalText) {
    return null;
  }

  const summary = summarizeSkillUsage(finalText);
  recordAuditTelemetry(payload, {
    hook: "skill-usage-audit.mjs",
    event: "stop",
    decision: "audit",
    audit_type: "skill_usage",
    prompt_id: promptId,
    has_routing_declaration: summary.hasRoutingDeclaration,
    no_skill_hit: summary.noSkillHit,
    missing_route: summary.missingRoute,
    routed_but_not_used: summary.routedButNotUsed,
    skills_routed: summary.routed,
    skills_used: summary.used,
    skills_skipped: summary.skipped,
    skills_recommended: summary.recommended,
    detail: summary.missingRoute ? "assistant response lacks skill routing declaration" : null,
    duration_ms: null,
  });

  return null;
}
