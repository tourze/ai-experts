import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const specDrivenDeliverySkill = defineSkill({
  id: "spec-driven-delivery",
  fullName: "需求驱动的可验证交付（SPARV）",
  description: "当需要把需求、计划、实现、审查和沉淀串成可验证交付流程，避免过早实现或跑偏时使用。",
  useCases: [
    "不是\"改一行\"的改动，需要把需求→实现→验证串起来一次走完。",
    "跨多次工具调用、可能跨 session，担心中途遗忘决策或跳过验证。",
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
      id: "checklists",
      source: new URL("./references/checklists.md", import.meta.url),
      target: "references/checklists.md",
      title: "checklists.md",
      summary: "Reference material for spec-driven-delivery.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "journal-format",
      source: new URL("./references/journal-format.md", import.meta.url),
      target: "references/journal-format.md",
      title: "journal-format.md",
      summary: "Reference material for spec-driven-delivery.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scoring-rubric",
      source: new URL("./references/scoring-rubric.md", import.meta.url),
      target: "references/scoring-rubric.md",
      title: "scoring-rubric.md",
      summary: "Reference material for spec-driven-delivery.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
