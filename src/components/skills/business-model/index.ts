import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const businessModelSkill = defineSkill({
  id: "business-model",
  description: "当用户要设计新商业模式、诊断现有产品变现、研究成熟公司商业模式，或用魏朱六要素分析中国市场因果逻辑、做产品-职能-市场铁三角一致性检验时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "iron-triangle",
      source: new URL("./references/iron-triangle.md", import.meta.url),
      target: "references/iron-triangle.md",
      title: "iron-triangle.md",
      summary: "Reference material for business-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "report-contract",
      source: new URL("./references/report-contract.md", import.meta.url),
      target: "references/report-contract.md",
      title: "report-contract.md",
      summary: "Reference material for business-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "weizhu-model",
      source: new URL("./references/weizhu-model.md", import.meta.url),
      target: "references/weizhu-model.md",
      title: "weizhu-model.md",
      summary: "Reference material for business-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for business-model.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
