import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import {
  ROUTING_REMINDER,
  SHORT_CONFIRMATION_RE,
} from "../_shared/skill-routing-rules";

export const skillRoutingReminderHook = defineHook({
  id: "skill-routing-reminder",
  description: "每轮注入轻量 skill 路由声明与下一步推荐提醒。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./skill-routing-reminder.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * skill-routing-reminder (UserPromptSubmit) — 每轮注入轻量路由提醒
 *
 * 行为:
 *   每次用户发送消息时注入一段简短提醒,要求当前代理在回复开头输出
 *   📌 Skill 路由声明,在结尾输出 📌 下一步推荐。
 *
 * 为什么要这么做:
 *   SessionStart 的路由规则只注入一次,在长对话中会被上下文压缩丢弃。
 *   本 hook 在每轮 UserPromptSubmit 时重新注入轻量提醒,确保路由声明
 *   在整个对话周期中不衰减。
 *
 * 放行条件(任一命中即不注入):
 *   - prompt 过短(< 8 字符)避免误触确认/闲聊
 *   - 斜杠命令(/xxx)
 *   - 纯确认性回复(好的、继续、ok 等)
 */


const MIN_PROMPT_LENGTH = 8;

export async function run(payload: NormalizedHookPayload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;

  // 斜杠命令不注入
  if (trimmed.startsWith("/")) return null;

  // Codex 显式 skill 调用不注入
  if (payload.platform === Platform.Codex && /^\$[A-Za-z0-9_-]+\b/u.test(trimmed)) return null;

  // 纯确认性回复不注入
  if (SHORT_CONFIRMATION_RE.test(trimmed)) return null;

  return {
    decision: "context",
    reason: ROUTING_REMINDER,
  };
}
