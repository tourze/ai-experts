import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const skillEvaluatorSkill = defineSkill({
  id: "skill-evaluator",
  fullName: "Skill Evaluator",
  description: "当用户要评估 skill 质量、审查 SKILL.md 设计结构或验证 skill 知识完备性时使用。仅优化 frontmatter description 触发质量用 `skill-activation-analyzer`。",
  useCases: [
    "当用户要评估 skill 质量、审查 SKILL.md 设计结构或验证 skill 知识完备性时使用。仅优化 frontmatter description 触发质量用 `skill-activation-analyzer`。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evaluation-dimensions",
      source: new URL("./references/evaluation-dimensions.md", import.meta.url),
      target: "references/evaluation-dimensions.md",
      title: "evaluation-dimensions.md",
      summary: "Reference material for skill-evaluator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evaluation-protocol",
      source: new URL("./references/evaluation-protocol.md", import.meta.url),
      target: "references/evaluation-protocol.md",
      title: "evaluation-protocol.md",
      summary: "Reference material for skill-evaluator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "examinee-prompt",
      source: new URL("./references/examinee-prompt.md", import.meta.url),
      target: "references/examinee-prompt.md",
      title: "examinee-prompt.md",
      summary: "Reference material for skill-evaluator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "examiner-prompt",
      source: new URL("./references/examiner-prompt.md", import.meta.url),
      target: "references/examiner-prompt.md",
      title: "examiner-prompt.md",
      summary: "Reference material for skill-evaluator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "failure-patterns",
      source: new URL("./references/failure-patterns.md", import.meta.url),
      target: "references/failure-patterns.md",
      title: "failure-patterns.md",
      summary: "Reference material for skill-evaluator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
