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

export const helmChartScaffoldingSkill = defineSkill({
  id: "helm-chart-scaffolding",
  fullName: "Helm Chart 搭建",
  description: "当用户要创建、重构或验证 Helm Chart 时使用。",
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
      id: "validate-chart",
      entry: new URL("./scripts/validate-chart.mjs", import.meta.url),
      target: "scripts/validate-chart.mjs",
      runtime: "node",
      bundle: false,
      description: "Script validate-chart.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "chart-structure",
      source: new URL("./references/chart-structure.md", import.meta.url),
      target: "references/chart-structure.md",
      title: "chart-structure.md",
      summary: "Reference material for helm-chart-scaffolding.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for helm-chart-scaffolding.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "chart-yaml",
      source: new URL("./assets/Chart.yaml.template", import.meta.url),
      target: "assets/Chart.yaml.template",
    }),
    defineAsset({
      id: "values-yaml",
      source: new URL("./assets/values.yaml.template", import.meta.url),
      target: "assets/values.yaml.template",
    })
  ],
});
