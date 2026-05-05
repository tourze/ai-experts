import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
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
  checklist: [
    "是否保留 `Chart.yaml`、`values.yaml`、`templates/` 和必要的 `_helpers.tpl`。",
    "是否为资源限制、探针、安全上下文和 ServiceAccount 提供默认值。",
    "是否把环境差异下沉到 values 文件而不是复制模板。",
    "是否验证依赖、渲染结果与 dry-run 安装路径。",
    "完整的 Chart 目录布局、values 模式、模板、钩子和依赖关系参考 [references/chart-structure.md](references/chart-structure.md)。",
  ],
  relatedSkills: [
    {
      get id() {
        return monitoringObservabilitySkill.id;
      },
      reason: "如果 chart 暴露指标或 ServiceMonitor，参阅 `monitoring-observability`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "模板里写死环境差异",
      pass: "差异下沉到 values",
    }),
    defineAntiPattern({
      fail: "明文 secret 进仓库",
      pass: "外部 Secret 引用",
    }),
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
