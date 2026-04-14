import { existsSync, readFileSync } from "node:fs";

import {
  NEXT_STEP_BLOCK_TEMPLATE,
  NEXT_STEP_RULES,
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

function isTextOnlyAssistant(record) {
  const content = record?.message?.content;
  if (typeof content === "string") {
    return content.trim().length > 0;
  }
  if (!Array.isArray(content)) {
    return false;
  }

  let hasText = false;
  for (const item of content) {
    if (!item) {
      continue;
    }
    if (item.type === "tool_use") {
      return false;
    }
    if (item.type === "text" && typeof item.text === "string" && item.text.trim()) {
      hasText = true;
    }
  }
  return hasText;
}

function getFinalAssistantText(records, promptId) {
  let finalAssistantRecord = null;

  for (const record of records) {
    if (record?.promptId !== promptId || record?.isSidechain === true || record?.type !== "assistant") {
      continue;
    }
    finalAssistantRecord = record;
  }

  if (!finalAssistantRecord || !isTextOnlyAssistant(finalAssistantRecord)) {
    return "";
  }

  return extractTextContent(finalAssistantRecord.message?.content).trim();
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
