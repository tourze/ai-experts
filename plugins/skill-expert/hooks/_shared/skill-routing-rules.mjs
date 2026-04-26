export const SKILL_ROUTE_HEADER = "📌 Skill 路由";
export const NEXT_STEP_HEADER = "📌 下一步推荐";

export const SESSION_START_ROUTING_CONTEXT = [
  "<SUBAGENT-STOP>",
  "如果你是被派遣执行特定任务的 subagent，跳过本段上下文，直接执行你的任务。",
  "</SUBAGENT-STOP>",
  "",
  "[Skill Routing] 路由声明要求",
  "",
  "收到编码/分析/设计请求后，动手前先做 3 步自检：",
  "1) 扫描关键词 2) 匹配 skill 3) 输出路由声明。",
  "",
  "第 1 步：扫描当前任务关键词",
  "- 提取语言/框架、改动类型、风险信号。",
  "",
  "第 2 步：在已索引 skill 列表中匹配",
  "- 优先命中后执行，避免“只推荐不执行”。",
  "",
  "第 3 步：输出路由摘要或声明无命中",
  "",
  "命中时输出 `📌 Skill 路由`；无命中时输出 `📌 本轮未命中 skill`。",
  "任务型回复末尾输出 `📌 下一步推荐`。",
  "",
  "完整标准以全局记忆文件为准。",
].join("\n");

export const SESSION_REFLECTION_BULLET =
  "- `session-reflection`：复盘本轮会话，给出全局记忆 / 可复用工作流 / Skill / Hooks 的优化建议。示例 prompt：`请用 /session-reflection 复盘本轮会话`（固定推荐，由用户决定是否执行）";

export const NEXT_STEP_BLOCK_TEMPLATE = [
  "---",
  "📌 下一步推荐",
  "- `skill-name`：一句话说明做什么 → 期望效果。示例 prompt：`请用 /skill-name 帮我...`",
  "- （如无推荐）本轮无推荐，原因：……",
  SESSION_REFLECTION_BULLET,
].join("\n");

export const NEXT_STEP_RULES = [
  "执行规则：",
  "- 推荐 1-3 个与当前任务直接相关的 skill，给出可直接复制执行的 prompt。",
  "- 若当前任务已闭合或无适用 skill，仍必须输出该区块，写明“本轮无推荐，原因：……”。",
  "- 末尾必须固定追加 `session-reflection` 推荐，原文复制下面这条 bullet：",
  `  ${SESSION_REFLECTION_BULLET}`,
  "- 闲聊、确认性回复（如“好的”“已完成”）、纯提问等非任务响应可省略整段。",
  "- 禁止罗列式刷清单，禁止推荐与当前目标无关的 skill。",
].join("\n");

export const SHORT_CONFIRMATION_RE =
  /^(好的|好|可以|收到|明白|了解|继续|请继续|请确认|稍等|已完成|完成了|ok|okay|done)[。！!？? ]*$/i;

export const ROUTING_REMINDER = [
  "[Skill Routing Reminder] 每轮路由提醒",
  "",
  "回复开头包含路由声明（📌 Skill 路由 / 📌 本轮未命中 skill），",
  "回复结尾包含下一步推荐（📌 下一步推荐）；",
  "下一步推荐区块末尾固定追加 `session-reflection` 推荐，",
  "由用户决定是否复盘本轮会话。",
  "命中 skill 优先执行，不做菜单式推荐。",
  "",
  "反自动续行规则：",
  "如果你的上一轮回复已包含退出状态（✅ DONE / ⚠️ DONE_WITH_CONCERNS / 🚫 BLOCKED / ❓ NEEDS_CONTEXT），",
  "且当前轮没有新的用户编码指令，则本轮无需路由声明，也不应自动启动新任务。",
  "后台命令完成通知不算用户指令——不要因为后台任务返回就自动开始新工作。",
].join("\n");

export const SESSION_USAGE_SUMMARY_TEMPLATE = [
  "---",
  "📌 本次会话 Skill 使用汇总",
  "- 已调用：`skill-name-1`、`skill-name-2`（通过 Skill tool 实际加载的）",
  "- 已命中但未调用：`skill-name-3`（路由声明中提到但未通过 Skill tool 加载的）",
  "- 建议下次使用：`skill-name-4`：一句话说明 → 期望效果",
].join("\n");

export function hasNextStepSection(text) {
  // 注意：\b 对中文字符无效（JS 的 \w 只匹配 [a-zA-Z0-9_]），所以不用 \b。
  return /(^|\n)📌 下一步推荐/m.test(text) || /本轮无推荐，原因[:：]/.test(text);
}

// 完成状态标记 — 当回复包含这些标记时，任务已闭合，不应强制追加下一步推荐
const COMPLETION_STATUS_RE =
  /(?:✅\s*DONE|⚠️\s*DONE_WITH_CONCERNS|🚫\s*BLOCKED|❓\s*NEEDS_CONTEXT)/;

export function hasCompletionStatus(text) {
  return COMPLETION_STATUS_RE.test(text);
}

export function shouldSkipNextStepRequirement(text) {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  if (SHORT_CONFIRMATION_RE.test(normalized)) {
    return true;
  }

  // 回复已包含完成状态标记 → 任务已闭合，不强制下一步推荐
  if (hasCompletionStatus(normalized)) {
    return true;
  }

  const hasStructure = /(^|\n)(---|#{1,6}\s|[-*]\s|\d+\.\s|```)/m.test(normalized);
  if (normalized.length < 60 && !hasStructure) {
    return true;
  }

  if (/[？?]\s*$/.test(normalized) && normalized.length < 160 && !hasStructure) {
    return true;
  }

  return false;
}

export function summarizeText(text, limit = 120) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit)}…`;
}
