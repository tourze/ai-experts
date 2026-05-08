import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

export const debugMethodologyPrimerHook = defineHook({
  id: "debug-methodology-primer",
  description: "检测 bug 调查意图并注入假设驱动与根因追溯调试方法论。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.UserPromptSubmit,
  entry: new URL("./debug-methodology-primer.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * debug-methodology-primer (UserPromptSubmit) — 检测 bug 调查意图并注入
 * 「假设驱动调查 + 根因追溯」两套互补的调试方法论
 *
 * 行为:
 *   当用户消息中出现明确的错误现象(crash / 报错 / 挂了 / timeout / 5xx)、
 *   调查动作(debug / 排查 / reproduce / root cause / 为什么会…)、或间歇性
 *   现象(flaky / 偶发 / 诡异 / regression)时,本 hook 注入一段
 *   additionalContext，内容合并假设驱动调查、症状/根因分离、canonical
 *   source 与 hidden writes 审计的核心原则，让当前代理在动手改代码前先走方法论。
 *
 * 为什么要这么做:
 *   只靠模型自律容易漏触发。实际大量调试场景里，当前代理拿到 prompt
 *   就开始 "让我试试改这里 → 没好 → 再试",
 *   完全不走假设驱动。参照 investigation-primer / feedback-detector 的
 *   模式:把触发时机从 "LLM 自觉" 改成 "UserPromptSubmit 机械匹配",
 *   方法论原样注入 prompt,强制在改代码前思考。
 *
 *   与 investigation-primer 的关系:两者是正交维度,可同时注入。
 *     • investigation-primer 讲 "编码前摸清项目家底"(定位/依赖/测试/风格)
 *     • 本 hook 讲 "bug 怎么查"(假设 + 根因 + hidden writes)
 *   dispatch.mjs 会把两段 context 用 \n\n 合并成一次 additionalContext。
 *
 * 非目标:
 *   - 不 block,只注入 context(false positive 的代价仅为多读一段文字)
 *   - 不替代记忆文件或 runtime skill,而是把触发时机机械化
 *   - 不对所有 "修复" 类 prompt 触发 —— 只对明确的 bug 调查场景触发。
 *     "修一下命名"、"修改注释"、"修复格式" 这类非运行时错误的 "修",
 *     不触发本 hook(investigation-primer 会覆盖它们)
 *   - 不做任何本仓库特定的维护动作
 *   - 不在 hook 内部自动读日志 / 跑调试器 —— hook 拿不到项目根,也不应阻塞
 *
 * 放行条件(任一命中即不注入):
 *   - prompt 过短(< 12 字符)
 *   - 斜杠命令(/xxx)不扫,避免对 skill 调用误触
 *   - 未命中任一调试信号
 */

// ── 调试信号:正则 + 类型分类 ──
//
// 设计取舍:
//   - 触发条件必须比 investigation-primer 的 fix 集合更窄。investigation-primer
//     会对 "修一?下 / 修复 / 修改" 这类通用动词触发,但调试方法论只针对
//     "有一个运行时错误或异常行为需要追根因" 的场景。所以本 hook 只在出现
//     明确的错误名词(bug/crash/error)、调试动词(debug/排查/为什么会)、
//     或间歇性形容词(flaky/偶发)时触发。
//   - 宁可多触发,不可漏触发 —— 本 hook 只注入 context,false positive 的
//     代价仅为多读一段文字。
//   - 英文动词全部加 \b 词边界。中文没有词边界,靠常见搭配限定。
//
// kind:
//   error       明确的错误现象(有一个可观察的故障)
//   investigate 明确的调查动作(用户在请求 debug / 找根因)
//   flaky       间歇性 / 诡异 / 回归现象(非确定性 bug)
const DEBUG_SIGNALS = [
  // === 中文 — 错误现象 ===
  { re: /bug|报错|异常|崩溃|死锁|panic|段错误|内存泄(?:露|漏)|栈溢出/i, kind: "error" },
  { re: /挂了|挂掉|不工作|不生效|失效|跑不起来|打不开|启动不了|起不来|无响应/, kind: "error" },
  { re: /超时|卡住|卡死|卡在|hang(?:\s*住)?/i, kind: "error" },
  { re: /闪退|直接退出|被杀|OOM|out\s*of\s*memory/i, kind: "error" },
  { re: /连不上|连接失败|请求失败|返回\s*[45]\d\d|5\d\d\s*错误/, kind: "error" },
  // === 中文 — 调查动作 ===
  { re: /调试一?下|调试代码|排查一?下|排查并|定位问题|找一?下原因|找根因|追踪一?下/, kind: "investigate" },
  { re: /复现一?下|重现一?下|想复现|无法复现/, kind: "investigate" },
  { re: /为什么(?:会|不|没|报|出|挂|死|这样|这么|总是|一直)/, kind: "investigate" },
  { re: /根(?:本)?原因|根因分析/, kind: "investigate" },
  // === 中文 — 间歇/诡异/回归 ===
  { re: /间歇(?:性|地)?|偶发|偶尔|有时候(?:会|才)|时不时|诡异|莫名/, kind: "flaky" },
  { re: /(?:线上|生产|prod)(?:出事|故障|告警|挂了|异常|报错)/i, kind: "flaky" },
  { re: /之前(?:能|可以|好好的)|以前(?:能|可以|好好的)|昨天还(?:能|好好的)/, kind: "flaky" },
  // === 英文 — 错误现象 ===
  { re: /\b(?:crash(?:ing|es|ed)?|panic(?:s|ked|king)?|segfault|segv|assertion|deadlock|oom)\b/i, kind: "error" },
  { re: /\b(?:error|exception|failure|broken|not\s+working|doesn'?t\s+work|stopped\s+working|stack\s*overflow)\b/i, kind: "error" },
  { re: /\bstack\s*trace|traceback\b/i, kind: "error" },
  { re: /\b(?:timeouts?|time[sd]\s*out|hang(?:ing|s|ed)?|stuck|unresponsive|frozen)\b/i, kind: "error" },
  { re: /\b(?:5\d\d\s*(?:error|status|response)?|internal\s+server\s+error|bad\s+gateway)\b/i, kind: "error" },
  // === 英文 — 调查动作 ===
  { re: /\b(?:debug|troubleshoot|investigate|diagnose|bisect)\b/i, kind: "investigate" },
  { re: /\b(?:reproduce|repro|min(?:imal)?\s+repro)\b/i, kind: "investigate" },
  { re: /\broot\s*cause(?:\s+analysis)?\b/i, kind: "investigate" },
  { re: /\bwhy\s+(?:does|is|did|are|doesn'?t|isn'?t|can'?t)\b/i, kind: "investigate" },
  // === 英文 — 间歇/诡异/回归 ===
  { re: /\b(?:intermittent|flaky|sporadic|non[-\s]?deterministic|heisenbug|race\s+condition)\b/i, kind: "flaky" },
  { re: /\b(?:regression|used\s+to\s+work|worked\s+before|was\s+working)\b/i, kind: "flaky" },
];

const MIN_PROMPT_LENGTH = 12;

function findHits(prompt: string) {
  const hits = [];
  for (const { re, kind } of DEBUG_SIGNALS) {
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

  // 斜杠命令(slash command)不扫,避免对 /debug-investigator 之类调用误触
  if (trimmed.startsWith("/")) return null;

  const hits = findHits(trimmed);
  if (hits.length === 0) return null;

  // 按 kind 去重 + 聚合命中片段(最多展示 5 条,避免注入过长)
  const kindSet = new Set(hits.map((h) => h.kind));
  const snippets = [...new Set(hits.map((h) => h.snippet))].slice(0, 5);

  const kindLabels: Record<string, string> = {
    error: "错误现象",
    investigate: "调查动作",
    flaky: "间歇/回归/诡异现象",
  };
  const kinds = [...kindSet].map((k) => kindLabels[k] || k).join("、");

  return {
    decision: "context",
    reason: [
      "[Debug Methodology Primer] 调试方法论 触发",
      "",
      "检测到当前 prompt 属于 bug 调查 / 故障排查类任务。先证据后改代码。",
      "",
      `  信号类型:${kinds}`,
      `  命中片段:${snippets.map((s) => `「${s}」`).join("、")}`,
      "",
      "── 最小调试流程 ──",
      "",
      "1. 先定义症状：观察值、期望值、复现条件、首次出现时间。",
      "2. 先收集证据：日志、trace、stack、近期变更。",
      "3. 再列假设：每条要可验证、可证伪；一次只验证一个变量。",
      "4. 根因优先：先修上游触发点，不用下游吞异常掩盖症状。",
      "5. 记录死胡同：失败假设也要留痕，避免重复试错。",
      "",
      "详细规则以全局记忆文件为准。",
    ].join("\n"),
  };
}
