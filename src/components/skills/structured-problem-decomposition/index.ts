import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const structuredProblemDecompositionSkill = defineSkill({
  id: "structured-problem-decomposition",
  fullName: "结构化问题拆解编排",
  description: "当需要把复杂模糊问题系统性拆解为可执行步骤时使用——从问题界定、结构化拆解、根因分析、系统动态识别、决策推进到 PDCA 改进闭环的六阶段编排流程。与 mckinsey-7-step（流程框架）、fishbone-diagram（根因工具）、first-principles-decomposer（假设挑战）互补：本 skill 给端到端编排逻辑和各阶段过渡标准。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "six-phases",
      source: new URL("./references/six-phases.md", import.meta.url),
      target: "references/six-phases.md",
      title: "six-phases.md",
      summary: "Reference material for structured-problem-decomposition.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for structured-problem-decomposition.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
