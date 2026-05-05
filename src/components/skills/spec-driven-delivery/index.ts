import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const specDrivenDeliverySkill = defineSkill({
  id: "spec-driven-delivery",
  description: "当需要把需求、计划、实现、审查和沉淀串成可验证交付流程，避免过早实现或跑偏时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for spec-driven-delivery.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
