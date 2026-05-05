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
  NEXT_STEP_BLOCK_TEMPLATE,
  NEXT_STEP_RULES,
  hasCompletionStatus,
  hasNextStepSection,
  shouldSkipNextStepRequirement,
  summarizeText,
} from "../_shared/skill-routing-rules.mjs";

export const skillNextStepGateHook = defineHook({
  id: "skill-next-step-gate",
  description: "拦截缺少下一步推荐区块的回复并要求补全。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.Stop,
  entry: new URL("./skill-next-step-gate.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

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

  if (hasNextStepSection(finalText) || shouldSkipNextStepRequirement(finalText)) {
    return null;
  }

  // 如果 transcript 中已有完成状态标记（DONE/BLOCKED/NEEDS_CONTEXT），
  // 且当前回复较短（< 500 字符），说明是完成后的跟进/确认，不强制下一步推荐。
  // 这避免了后台命令完成后 AI 被迫继续工作的问题。
  if (finalText.length < 500) {
    const hasCompletionInTranscript = records.some((r) => {
      if (r?.type !== "assistant" || r?.isSidechain === true) return false;
      // Codex records use different structure
      if (r?.payload?.content) {
        const text = r.type === "response_item" ? r.payload.content : null;
        if (text) return hasCompletionStatus(typeof text === "string" ? text : JSON.stringify(text));
      }
      const content = r.message?.content;
      if (!content) return false;
      return hasCompletionStatus(typeof content === "string" ? content : content.filter?.(c => c?.type === "text").map?.(c => c.text).join("\n") || "");
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
