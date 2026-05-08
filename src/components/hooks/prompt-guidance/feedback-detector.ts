import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

export const feedbackDetectorHook = defineHook({
  id: "feedback-detector",
  description: "检测反馈信号并注入 Reflection 五步反思工作流。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./feedback-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * feedback-detector (UserPromptSubmit) — 检测反馈信号并注入 reflection 提示词
 *
 * 行为:
 *   当用户消息中出现"不要 / 别 / 不对 / 错了 / 为什么你又…"或
 *   "以后 / 下次 / 记住 / from now on / next time / please always…"
 *   等反馈信号时,本 hook 注入一段 additionalContext,
 *   内容是反思五步工作流 + 原则，让当前代理
 *   在处理当前请求前先按 reflection 流程反思。
 *
 * 为什么要这么做:
 *   反馈反思只靠模型自觉容易漏触发。本 hook 把触发时机改为
 *   "UserPromptSubmit 事件机械匹配"，把方法论作为 prompt 的一部分注入，
 *   确保当前代理收到提示就按五步走。
 *
 * 非目标:
 *   - 不做任何本仓库特定的维护动作(例如 auto memory 写盘、特定目录写入)
 *   - 不指定必须修改哪个文件;目标媒介(skill / 记忆文件 / hook)
 *     由当前代理按反思结论决定，遵循“一次只提一条精简改动”原则
 *   - 不跳过 Propose → Confirm → Apply 的确认环节;禁止擅自落盘
 *
 * 放行条件:
 *   - prompt 过短(< 6 字符)避免误触
 *   - 斜杠命令(/xxx)不扫,避免对 skill 调用误触
 *   - 未命中任一信号词
 */

// ── 反馈信号:正则 + 类型分类 ──
// kind:correction (即时纠正) / preference (长期偏好) / frustration (情绪信号)
const FEEDBACK_SIGNALS = [
  // === 中文 — 纠正 ===
  { re: /不要\s*(?:这样|那样|再|总是|老是)?/, kind: "correction" },
  { re: /别\s*(?:这样|那样|再|总是|老是|给我)/, kind: "correction" },
  { re: /不对|错了|不是这样/, kind: "correction" },
  { re: /停[一下来]{0,2}(?:[,，。!！]|$)/, kind: "correction" },
  { re: /我(?:说|要求)过(?:不要|别)/, kind: "correction" },
  // === 中文 — 情绪/重复犯错 ===
  { re: /为什么你(?:又|总是|老是|还|一直|还要)/, kind: "frustration" },
  { re: /你(?:又|总是|老是|一直)(?:忘|漏|错|没)/, kind: "frustration" },
  // === 中文 — 长期偏好 ===
  { re: /以后(?:不要|都|请|记得|一直|务必|必须)/, kind: "preference" },
  { re: /下次(?:不要|都|请|记得|务必|注意)/, kind: "preference" },
  { re: /从(?:今|现在|此)(?:以后|开始)/, kind: "preference" },
  { re: /记住[:：,，]?/, kind: "preference" },
  { re: /(?:我|咱们)(?:不喜欢|不希望|希望你|想让你)/, kind: "preference" },
  { re: /(?:一定|务必|请)要?记(?:住|得)/, kind: "preference" },
  // === 英文 — 纠正 ===
  { re: /don['']t\s+(?:do|use|make|add|remove|create|write|include)/i, kind: "correction" },
  { re: /do not\s+(?:do|use|make|add|remove|create|write|include)/i, kind: "correction" },
  { re: /stop\s+(?:doing|using|adding|making|creating|writing|including)/i, kind: "correction" },
  { re: /no,\s+(?:don['']t|that|not|this)/i, kind: "correction" },
  { re: /that['']?s (?:not|wrong|incorrect)/i, kind: "correction" },
  // === 英文 — 情绪 ===
  { re: /why (?:did|are|do) you/i, kind: "frustration" },
  { re: /you (?:always|keep|never) /i, kind: "frustration" },
  // === 英文 — 长期偏好 ===
  { re: /from now on/i, kind: "preference" },
  { re: /next time/i, kind: "preference" },
  { re: /please (?:always|never|remember|don['']t)/i, kind: "preference" },
  { re: /remember (?:to|that|this|not)/i, kind: "preference" },
  { re: /i (?:don['']t|do not) (?:like|want)/i, kind: "preference" },
  { re: /i (?:want|need) you to (?:always|never)/i, kind: "preference" },
];

const MIN_PROMPT_LENGTH = 6;

function findHits(prompt: string) {
  const hits = [];
  for (const { re, kind } of FEEDBACK_SIGNALS) {
    const match = prompt.match(re);
    if (match) {
      hits.push({ kind, snippet: match[0].trim() });
    }
  }
  return hits;
}

export async function run(payload: NormalizedHookPayload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;

  // 斜杠命令(slash command)不扫,避免对 /reflection 之类调用误触
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(prompt);
  if (hits.length === 0) return null;

  // 按 kind 去重 + 聚合命中片段
  const kindSet = new Set(hits.map((h) => h.kind));
  const snippets = [...new Set(hits.map((h) => h.snippet))].slice(0, 5);

  const kindLabels: Record<string, string> = {
    correction: "即时纠正",
    preference: "长期偏好",
    frustration: "重复犯错/情绪信号",
  };
  const kinds = [...kindSet].map((k) => kindLabels[k] || k).join("、");

  return {
    decision: "context",
    reason: [
      "[Feedback Detector] Reflection 触发",
      "",
      "检测到用户消息中出现反馈/纠正信号。在处理当前请求之前,请先按以下",
      "Reflection 工作流反思,再继续。(本段注入内容是平台中立的反馈反思协议,",
      "适用于任何工程场景。)",
      "",
      `  信号类型:${kinds}`,
      `  命中片段:${snippets.map((s) => `"${s}"`).join("、")}`,
      "",
      "── Reflection 五步 ──",
      "",
      "1. Analyze",
      "   回顾本轮对话、工具调用、以及任何失败或纠正。识别用户反馈具体指向",
      "   哪个行为、哪个决策、哪次工具输出。不要泛化,要锚定到具体事件。",
      "",
      "2. Identify",
      "   判断这是:",
      "   (a) 一次性调整 —— 只在当前任务生效,不需要沉淀",
      "   (b) 长期偏好 / 反复出现的纠正模式 —— 值得固化为规则",
      "   只有 (b) 才进入后续 Propose/Confirm/Apply 步骤。",
      "",
      "3. Propose(只提议,不动手)",
      "   草拟**一条**精简改动,候选媒介(按场景任选其一):",
      "     • 更新某个 skill → 展示 diff",
      "     • 在记忆文件中新增条目 → 展示新增内容",
      "     • 新增一个 hook / 规则 → 说明事件 × matcher × 判定逻辑",
      "     • 其他用户现有知识库形式",
      "   原则:",
      "     - One at a time:一次只提一条,保持聚焦,便于审阅",
      "     - Conciseness:几个字能讲清楚就不写一段",
      "     - Specificity:既能解决此次反馈,又尽量能迁移到同类场景",
      "",
      "4. Confirm(**必须**等用户确认)",
      "   把提议呈现给用户,明确请求同意。**严禁在未得到确认前就修改文件。**",
      "   若用户提出调整,回到第 3 步重新草拟。",
      "",
      "5. Apply",
      "   只有在用户明确同意后,才真正落盘修改。完成后简述修改位置,",
      "   然后继续当前任务,用调整后的行为回应用户。",
      "",
      "── 附加原则 ──",
      "",
      "  • Failure Analysis:工具调用失败或被用户纠正的点,是反思的首要素材",
      "  • Conflict Resolution:若提议与已有规则冲突,提出权衡方案交用户决定",
      "  • 保持中立简洁,不自辩,不掩饰错误",
      "  • 不确定就问,不要擅自固化为永久规则",
      "",
      "依据:Analyze → Identify → Propose → Confirm → Apply 工作流由本 hook 自动注入,",
      "     反馈反思职责由 hook 接管。",
    ].join("\n"),
  };
}
