import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
      reason: "需要根因深挖：PDCA 的 Plan 阶段可以配合 `fishbone-diagram`；一次性计划只需要 5W2H 时，参考 fishbone-diagram 的 5W2H reference，不把它当作独立 skill 链接。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "Plan：定义问题、现状基线、量化目标、根因假设、措施、负责人、截止时间和风险；根因不清时先用 `fishbone-diagram`。",
      "Do：按最小可控范围执行措施，记录变更内容、执行时间、受影响对象和异常情况。",
      "Check：用目标值 vs 实际值做量化对比，解释偏差来源，并判断措施是否真正影响目标指标。",
      "Act：把有效措施标准化，把无效或副作用措施回滚/修正，同时提出下一轮要解决的新问题。",
      "进入下一轮：保留本轮证据、决策和未解决项，不把一次性行动计划伪装成 PDCA。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "本轮问题与量化目标。",
      "PDCA 表：Plan / Do / Check / Act 的动作、证据和责任人。",
      "目标值 vs 实际值对比与偏差原因。",
      "标准化动作、纠偏动作和下一轮问题。",
    ],
  }),
  tools: [],
});
