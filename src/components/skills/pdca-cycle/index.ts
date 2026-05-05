import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { fishboneDiagramSkill } from "../fishbone-diagram/index";

export const pdcaCycleSkill = defineSkill({
  id: "pdca-cycle",
  fullName: "PDCA 循环",
  description: "当用户要用 PDCA 做持续改进、质量管理、运营优化或闭环问题解决时使用。",
  useCases: [
    "运营流程的持续改进（每轮解决一个问题，螺旋上升）。",
    "质量管理和 SLA 达标。",
    "与 `fishbone-diagram` 配合：Plan 阶段用鱼骨图找原因。",
  ],
  constraints: [
    "PDCA 是**循环**不是一次性：每轮结束立即进入下一轮。",
    "**Plan 阶段最重要**——计划不充分，后面三步都是浪费。Plan 包含：找问题、找原因（鱼骨图/逻辑树）、找要因（80/20）、订计划（措施/目标/负责人/截止日期）。",
    "Check 不是\"看了一眼\"，要有量化对比：目标值 vs 实际值，偏差原因分析。",
    "Act 分两种动作：纠正偏差（修） + 提出新问题（进入下一轮）。只纠正不提新问题 = 开环。",
  ],
  checklist: [
    "Plan 阶段有明确的问题定义和量化目标。",
    "Do 阶段有执行记录。",
    "Check 阶段有目标 vs 实际的量化对比。",
    "Act 阶段同时做了纠正和下一轮问题识别。",
  ],
  relatedSkills: [
    {
      get id() {
        return fishboneDiagramSkill.id;
      },
      reason: "需要根因深挖：PDCA 的 Plan 阶段可以配合 `fishbone-diagram`，但 PDCA 本身不做深度根因分析。",
    },
    {
      get id() {
        return fishboneDiagramSkill.id;
      },
      label: "five-w-two-h",
      reason: "一次性项目（无需迭代）：PDCA 是循环改进工具，一次性交付用 `five-w-two-h` 做计划。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只有 PD 没有 CA",
      pass: "完整闭环",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
