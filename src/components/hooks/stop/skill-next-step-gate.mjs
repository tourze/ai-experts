import { existsSync, readFileSync } from "node:fs";

import {
  NEXT_STEP_BLOCK_TEMPLATE,
  NEXT_STEP_RULES,
  hasCompletionStatus,
  hasNextStepSection,
  shouldSkipNextStepRequirement,
  summarizeText,
} from "../_shared/skill-routing-rules.mjs";

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
      // 跳过损坏行，避免因为日志尾部半行而误伤 Stop。
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
  // 聚合当前 promptId 下所有 assistant 消息的文本内容。
  // 这修复了「最后一轮是 tool_use 导致 gate 被绕过」的问题：
  // 旧逻辑要求最后一条 assistant 消息必须是纯文本才检查,
  // 实际场景中最后一条经常含 tool_use,导致 gate 直接放行。
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

  if (hasNextStepSection(finalText) || shouldSkipNextStepRequirement(finalText)) {
    return null;
  }

  // 如果 transcript 中已有完成状态标记（DONE/BLOCKED/NEEDS_CONTEXT），
  // 且当前回复较短（< 500 字符），说明是完成后的跟进/确认，不强制下一步推荐。
  // 这避免了后台命令完成后 AI 被迫继续工作的问题。
  if (finalText.length < 500) {
    const hasCompletionInTranscript = records.some((r) => {
      if (r?.type !== "assistant" || r?.isSidechain === true) return false;
      const text = extractTextContent(r.message?.content);
      return hasCompletionStatus(text);
    });
    if (hasCompletionInTranscript) {
      return null;
    }
  }

  const summary = summarizeText(finalText);

  return {
    decision: "block",
    reason: [
      "[Skill Next Step Gate] 当前最终回复缺少固定的“下一步推荐”区块。",
      "",
      "请在本轮回复末尾补上以下内容后再结束：",
      "",
      NEXT_STEP_BLOCK_TEMPLATE,
      "",
      NEXT_STEP_RULES,
      "",
      "当前回复摘要：",
      `- ${summary}`,
    ].join("\n"),
  };
}
