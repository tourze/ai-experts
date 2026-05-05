import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { crossPollinationEngineSkill } from "../cross-pollination-engine/index";

export const firstPrinciplesDecomposerSkill = defineSkill({
  id: "first-principles-decomposer",
  fullName: "第一性原理解构器",
  description: "当需要用第一性原理拆解事实层、识别隐含假设、重建问题边界、从零推导方案时使用。",
  useCases: [
    "用户说“从第一性原理重想”“从头来过”“我们是不是默认了太多”。",
    "现有做法很复杂、很贵，或者“行业都这么做”的理由站不住。",
    "需要挑战既有框架、重新定义问题或重建方案。",
    "分解后可配合 [inversion-strategist](references/inversion-strategist.md) 反推失败路径。",
    "需要借别的行业做类比时，可接 `cross-pollination-engine`。",
  ],
  constraints: [
    "先用一句话定义问题，再开始拆，不要一边拆一边换题。",
    "明确区分“假设”和“事实”；竞品做法、行业惯例、客户原话都不是天然事实。",
    "通过连续追问“为什么”，一直挖到不可再压缩的约束、物理事实、用户底层需求或制度条件。",
    "重建方案时，只能引用已验证的基础事实，不能偷偷把旧方案的默认前提带回来。",
    "最后必须对比“重建方案 vs. 常规方案”，让差异可见。",
    "需要更完整方法时，参考 [详细框架](references/framework.md)、[示例集](references/examples.md) 和 [组合框架](references/integrated-frameworks.md)。",
  ],
  checklist: [
    "问题是否已经收敛成一句清晰陈述。",
    "是否至少列出了 3 个待挑战的关键假设。",
    "基础事实是否真的不可再压缩、不可轻易反驳。",
    "新方案是否只建立在这些事实之上。",
    "是否说明了和常规做法的差别与收益。",
    "是否给出后续验证点或最小实验。",
  ],
  relatedSkills: [
    {
      get id() {
        return crossPollinationEngineSkill.id;
      },
      reason: "需要借别的行业做类比时，可接 `cross-pollination-engine`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "行业标准当事实",
      pass: "拆到不可再压缩的物理层",
    }),
    defineAntiPattern({
      fail: "替代症状不解决根需求",
      pass: "追问到底层需求",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "examples",
      source: new URL("./references/examples.md", import.meta.url),
      target: "references/examples.md",
      title: "examples.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "framework",
      source: new URL("./references/framework.md", import.meta.url),
      target: "references/framework.md",
      title: "framework.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "integrated-frameworks",
      source: new URL("./references/integrated-frameworks.md", import.meta.url),
      target: "references/integrated-frameworks.md",
      title: "integrated-frameworks.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "inversion-strategist",
      source: new URL("./references/inversion-strategist.md", import.meta.url),
      target: "references/inversion-strategist.md",
      title: "inversion-strategist.md",
      summary: "Reference material for first-principles-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
