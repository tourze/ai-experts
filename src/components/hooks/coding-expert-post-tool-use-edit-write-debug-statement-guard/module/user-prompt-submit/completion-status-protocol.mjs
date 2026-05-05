/**
 * completion-status-protocol (UserPromptSubmit) — 在编码任务开始时注入
 * 标准化退出报告协议,确保每个任务结束时明确报告状态
 *
 * 行为:
 *   当用户消息中出现编码任务信号(与 investigation-primer 相同的触发词)时,
 *   注入「完成时必须报告 DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT」
 *   的协议。让 Claude 在任务结束时给出结构化的退出状态,而不是模糊的
 *   "完成了"/"搞定了"。
 *
 * 为什么要这么做:
 *   Claude 完成任务后的报告质量参差不齐:有时给出详细的变更清单,有时
 *   只说"已完成",有时甚至在遇到阻塞时不明确说明。标准化退出状态让用户
 *   在扫一眼就能判断:任务真的做完了吗?有没有留尾巴?是不是被卡住了?
 *
 *   灵感来源:gstack 的 Completion Status Protocol + Escalation Protocol。
 *
 *   与其他 primer 的关系:正交。investigation-primer 管「开始前怎么调查」,
 *   本 hook 管「结束时怎么报告」。两者可同时注入,dispatch.mjs 合并为一次
 *   additionalContext。
 *
 * 非目标:
 *   - 不 block,只注入 context
 *   - 不强制 Claude 写冗长的报告 —— 小任务用一行状态即可
 *   - 不替代 skill 自身的输出格式 —— 本协议是兜底,skill 有自己的输出规范时
 *     以 skill 为准,但状态行仍应出现
 *   - 不做任何仓库特定维护动作
 *
 * 放行条件:
 *   - prompt 过短(< 12 字符)
 *   - 斜杠命令(/xxx)不扫
 *   - 未命中任一编码任务信号
 *   - 纯问答/解释类请求(「什么是 / 解释一下 / 区别是」)
 */

// ── 编码任务信号 ──
// 复用 investigation-primer 的核心触发词,但精简为最高频子集,
// 避免在纯问答场景误触(问答不需要退出状态)
const TASK_SIGNALS = [
  // 中文 — 实现/创建
  /实现(?:一?个|一?下)?/,
  /新增|新建|添加|创建/,
  /做一?个|写一?个|搭建/,
  // 中文 — 修复
  /修复|修一?下|解决/,
  /排查并修|定位(?:并|和)修/,
  // 中文 — 重构
  /重构|重写|拆分|合并|提取(?:成|出|到)/,
  // 中文 — 修改
  /修改|更改|调整|更新/,
  /替换(?:为|成)?|换成|改成/,
  /优化|改进/,
  // 中文 — 删除
  /删除|移除|去掉|清除/,
  // 英文 — 实现
  /\b(?:implement|add|create|build|write|scaffold|set\s?up)\b/i,
  // 英文 — 修复
  /\b(?:fix|resolve|patch|debug)\b/i,
  // 英文 — 重构
  /\b(?:refactor|rewrite|restructure|extract|split|merge)\b/i,
  // 英文 — 修改
  /\b(?:change|modify|update|adjust|replace|rename|migrate)\b/i,
  /\b(?:optimi[sz]e|improve|enhance)\b/i,
  // 英文 — 删除
  /\b(?:remove|delete|drop|purge|clean\s+up)\b/i,
];

// ── 纯问答信号:命中则放行 ──
const QA_SIGNALS = [
  /什么是|是什么|解释一下|帮我理解|区别是|怎么理解|含义/,
  /\bwhat\s+is\b|\bexplain\b|\bdifference\s+between\b|\bwhat\s+does\b/i,
  /\bhow\s+does\b|\bwhy\s+is\b|\bwhat\s+are\b/i,
];

const MIN_PROMPT_LENGTH = 12;

export async function run(payload) {
  const prompt = payload?.prompt;
  if (typeof prompt !== "string") return null;

  const trimmed = prompt.trim();
  if (trimmed.length < MIN_PROMPT_LENGTH) return null;
  if (trimmed.startsWith("/")) return null;

  // 纯问答放行
  if (QA_SIGNALS.some((re) => re.test(trimmed))) return null;

  // 必须命中至少一个编码任务信号
  const hit = TASK_SIGNALS.some((re) => re.test(trimmed));
  if (!hit) return null;

  return {
    decision: "context",
    reason: [
      "[Completion Status Protocol] 任务退出协议 已激活",
      "",
      "本次是编码任务。完成时请在末尾输出结构化状态：",
      "✅ DONE / ⚠️ DONE_WITH_CONCERNS / 🚫 BLOCKED / ❓ NEEDS_CONTEXT",
      "",
      "升级条件：",
      "• 同一路径尝试 3 次失败",
      "• 安全敏感改动无法确认正确性",
      "• 改动范围超出可验证边界",
      "",
      "详细规范以全局记忆文件为准。",
    ].join("\n"),
  };
}
