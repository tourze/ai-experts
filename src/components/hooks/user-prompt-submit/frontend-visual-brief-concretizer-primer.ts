import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const frontendVisualBriefConcretizerPrimerHook = defineHook({
  id: "frontend-visual-brief-concretizer-primer",
  description: "检测抽象视觉词并注入审美词翻译为可执行 brief 的引导。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./frontend-visual-brief-concretizer-primer.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * visual-brief-concretizer-primer (UserPromptSubmit)
 *
 * 检测“大气 / 高级 / 专业 / 科技感”等抽象视觉词，提醒先把审美词
 * 翻译成品牌意图、视觉信号和反模式，再进入设计或前端实现。
 */

const VISUAL_CONTEXT_SIGNALS = [
  /设计|视觉|界面|UI|页面|首页|官网|落地页|海报|封面|PPT|演示|品牌|物料|banner/i,
  /风格|配色|字体|排版|画面|主视觉|视觉稿|设计稿|landing\s?page|website|poster|slide|deck|brand|visual|style|layout/i,
];

const ABSTRACT_VISUAL_SIGNALS = [
  /大气|高级|高端|专业|科技感|未来感|贵气|品牌感|有灵魂|冲击力|质感|氛围感|酷炫|精致/,
  /\bpremium\b|\bprofessional\b|\bpolished\b|\benterprise\b|\bmodern\b|\bfuturistic\b|\bluxury\b|\bbrand\s+feel\b|\bmake\s+it\s+pop\b|\bwow\s+factor\b/i,
];

const MIN_PROMPT_LENGTH = 10;

function firstMatch(regexes, prompt) {
  for (const re of regexes) {
    const match = prompt.match(re);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

export async function run(payload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;
  if (trimmed.startsWith("/")) return null;

  const visualHit = firstMatch(VISUAL_CONTEXT_SIGNALS, trimmed);
  const abstractHit = firstMatch(ABSTRACT_VISUAL_SIGNALS, trimmed);
  if (!visualHit || !abstractHit) return null;

  return {
    decision: "context",
    reason: [
      "[Visual Brief Concretizer Primer] 抽象视觉需求 触发",
      "",
      "检测到当前任务同时包含视觉载体和抽象审美词。先使用 `visual-brief-concretizer`，把模糊词翻译成可执行 brief，再进入视觉 token、PPT、图片或前端实现。",
      "",
      `  视觉载体:${visualHit}`,
      `  抽象词:${abstractHit}`,
      "",
      "── 执行提醒 ──",
      "1. 先判断抽象词背后的品牌意图：未来感 / 权威感 / 历史感 / 高端感 / 可信感。",
      "2. 每个方向给出 imagery、palette、typography、layout 中至少 3 类视觉信号。",
      "3. 同时列出反模式，避免把高楼、星球、金色大字、霓虹渐变等符号无关堆叠。",
      "4. 有上下文就先写假设；缺少关键品牌约束时最多问 3 个问题。",
      "",
      "分流：进入 token 落地用 `visual-design-foundations`；行业风格用 `industry-design-presets`；已实现界面审查用 `frontend-design-review`。",
    ].join("\n"),
  };
}
