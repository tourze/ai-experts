export const SKILL_ROUTE_HEADER = "📌 Skill 路由";
export const NEXT_STEP_HEADER = "📌 下一步推荐";

export const SESSION_START_ROUTING_CONTEXT = [
  "<SUBAGENT-STOP>",
  "如果你是被派遣执行特定任务的 subagent，跳过本段上下文，直接执行你的任务。",
  "</SUBAGENT-STOP>",
  "",
  "[Skill Routing] 路由声明要求",
  "",
  "收到用户的编码/分析/设计类请求后，在动手之前，先在内心完成以下 3 步自检。",
  "如果命中 skill，必须先输出路由摘要再执行。",
  "",
  "第 1 步：扫描当前任务关键词",
  "- 从用户消息和工作区上下文中提取：涉及的语言/框架、改动类型（新功能/修复/重构/配置/文档）、风险信号（安全/数据库/基础设施）。",
  "",
  "第 2 步：在已索引 skill 列表中匹配",
  "- 将提取的关键词与上下文中可用的 skill 列表做匹配。",
  "- skill 数量有 300+，几乎所有编码任务都能命中至少 1 个 skill。",
  "- 如果你认为“没有匹配的 skill”，大概率是没认真扫描，需要回去再看一遍。",
  "",
  "第 3 步：输出路由摘要或声明无命中",
  "",
  "命中时，在响应开头输出：",
  "📌 Skill 路由",
  "- 命中：`skill-name`（命中理由）",
  "- 触发方式：用户指令 / 上下文自动匹配",
  "- 编排位置：链路名 第 N/M 步（多 skill 串联时输出，否则省略）",
  "- 跳过：`skill-name`（存在明显候选但决定不用时输出，否则省略）",
  "",
  "然后调用对应 skill 执行。多 skill 串联时，每个 skill 执行前各输出一次路由摘要。",
  "",
  "确实无命中时，在响应开头输出：",
  "📌 本轮未命中 skill，原因：……",
  "",
  "跳过自检直接动手 = 违规。",
  "没有路由摘要的编码响应 = 不合格。",
].join("\n");

export const NEXT_STEP_BLOCK_TEMPLATE = [
  "---",
  "📌 下一步推荐",
  "- `skill-name`：一句话说明做什么 → 期望效果。示例 prompt：`请用 /skill-name 帮我...`",
  "- （如无推荐）本轮无推荐，原因：……",
].join("\n");

export const NEXT_STEP_RULES = [
  "执行规则：",
  "- 推荐 1-3 个与当前任务直接相关的 skill，给出可直接复制执行的 prompt。",
  "- 若当前任务已闭合或无适用 skill，仍必须输出该区块，写明“本轮无推荐，原因：……”。",
  "- 闲聊、确认性回复（如“好的”“已完成”）、纯提问等非任务响应可省略。",
  "- 禁止罗列式刷清单，禁止推荐与当前目标无关的 skill。",
].join("\n");

export const SHORT_CONFIRMATION_RE =
  /^(好的|好|可以|收到|明白|了解|继续|请继续|请确认|稍等|已完成|完成了|ok|okay|done)[。！!？? ]*$/i;

export const ROUTING_REMINDER = [
  "[Skill Routing Reminder] 每轮路由提醒",
  "",
  "你的回复必须在开头包含路由声明（📌 Skill 路由 或 📌 本轮未命中 skill），",
  "在结尾包含下一步推荐（📌 下一步推荐）。",
  "如果本轮实际通过 Skill tool 调用了 skill，请在路由声明中注明「已调用」；",
  "如果仅凭已有知识回答而未调用 Skill tool，请注明「未调用，凭已有知识回答」。",
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

export function shouldSkipNextStepRequirement(text) {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  if (SHORT_CONFIRMATION_RE.test(normalized)) {
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
