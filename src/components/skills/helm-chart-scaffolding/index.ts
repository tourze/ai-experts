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
import { monitoringObservabilitySkill } from "../monitoring-observability/index";

export const helmChartScaffoldingSkill = defineSkill({
  id: "helm-chart-scaffolding",
  fullName: "Helm Chart 搭建",
  description: "当用户要创建、重构或验证 Helm Chart 时使用。",
  useCases: [
    "从零创建新的 Helm Chart。",
    "把散落的 Kubernetes manifest 收敛到可复用 Chart。",
    "需要为多环境部署整理 values 分层和依赖管理。",
    "发布前做 `helm lint`、模板渲染与结构校验。",
  ],
  constraints: [
    "优先使用 `apiVersion: v2` 的 application chart。",
    "`values.yaml` 按镜像、网络、资源、安全、依赖项分层，避免扁平大表。",
    "Chart 中不要存放明文敏感值；机密优先交给外部 Secret 管理。",
    "交付前至少运行 `helm lint` 与 [scripts/validate-chart.mjs](scripts/validate-chart.mjs)。",
  ],
  relatedSkills: [
    {
      get id() {
        return monitoringObservabilitySkill.id;
      },
      reason: "如果 chart 暴露指标或 ServiceMonitor，参阅 `monitoring-observability`。",
    },
  ],
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
