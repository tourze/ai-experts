import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pdcaCycleSkill = defineSkill({
  id: "pdca-cycle",
  fullName: "PDCA 循环",
  description: "当用户要用 PDCA 做持续改进、质量管理、运营优化或闭环问题解决时使用。",
  useCases: [
    "运营流程的持续改进（每轮解决一个问题，螺旋上升）。",
    "质量管理和 SLA 达标。",
    "与 [fishbone-diagram](../fishbone-diagram/SKILL.md) 配合：Plan 阶段用鱼骨图找原因。",
  ],
  constraints: [
    "PDCA 是**循环**不是一次性：每轮结束立即进入下一轮。",
    "**Plan 阶段最重要**——计划不充分，后面三步都是浪费。Plan 包含：找问题、找原因（鱼骨图/逻辑树）、找要因（80/20）、订计划（措施/目标/负责人/截止日期）。",
    "Check 不是\"看了一眼\"，要有量化对比：目标值 vs 实际值，偏差原因分析。",
    "Act 分两种动作：纠正偏差（修） + 提出新问题（进入下一轮）。只纠正不提新问题 = 开环。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
