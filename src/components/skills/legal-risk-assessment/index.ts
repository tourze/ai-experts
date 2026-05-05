import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const legalRiskAssessmentSkill = defineSkill({
  id: "legal-risk-assessment",
  fullName: "法律风险评估",
  description: "当需要评估合同、合规、劳动或争议事项的法律风险时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "employment-contract-templates",
      source: new URL("./references/employment-contract-templates.md", import.meta.url),
      target: "references/employment-contract-templates.md",
      title: "employment-contract-templates.md",
      summary: "Reference material for legal-risk-assessment.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "gdpr-data-handling",
      source: new URL("./references/gdpr-data-handling.md", import.meta.url),
      target: "references/gdpr-data-handling.md",
      title: "gdpr-data-handling.md",
      summary: "Reference material for legal-risk-assessment.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for legal-risk-assessment.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
