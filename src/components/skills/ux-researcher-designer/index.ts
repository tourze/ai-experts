import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const uxResearcherDesignerSkill = defineSkill({
  id: "ux-researcher-designer",
  fullName: "UX Researcher Designer",
  description: "当用户需要做用户研究、需求验证、persona 构建或设计复盘时使用（设计视角：访谈→persona→设计输入）。市场/客户研究用 `customer-research`；旅程图触点可视化用 `customer-journey-map`。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "persona-generator",
      entry: new URL("./scripts/persona_generator.mjs", import.meta.url),
      target: "scripts/persona_generator.mjs",
      runtime: "node",
      bundle: false,
      description: "Script persona_generator.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "example-personas",
      source: new URL("./references/example-personas.md", import.meta.url),
      target: "references/example-personas.md",
      title: "example-personas.md",
      summary: "Reference material for ux-researcher-designer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "journey-mapping-guide",
      source: new URL("./references/journey-mapping-guide.md", import.meta.url),
      target: "references/journey-mapping-guide.md",
      title: "journey-mapping-guide.md",
      summary: "Reference material for ux-researcher-designer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "persona-methodology",
      source: new URL("./references/persona-methodology.md", import.meta.url),
      target: "references/persona-methodology.md",
      title: "persona-methodology.md",
      summary: "Reference material for ux-researcher-designer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "usability-testing-frameworks",
      source: new URL("./references/usability-testing-frameworks.md", import.meta.url),
      target: "references/usability-testing-frameworks.md",
      title: "usability-testing-frameworks.md",
      summary: "Reference material for ux-researcher-designer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for ux-researcher-designer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "research-plan-template",
      source: new URL("./assets/research_plan_template.md", import.meta.url),
      target: "assets/research_plan_template.md",
    })
  ],
});
