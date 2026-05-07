import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, helmChartScaffoldingValidateChart } from "../../procedures/index";

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
    "交付前至少运行 `helm lint` 与 `helm-chart-scaffolding-validate-chart` procedure。",
  ],
  checklist: [
    "是否保留 `Chart.yaml`、`values.yaml`、`templates/` 和必要的 `_helpers.tpl`。",
    "是否为资源限制、探针、安全上下文和 ServiceAccount 提供默认值。",
    "是否把环境差异下沉到 values 文件而不是复制模板。",
    "是否验证依赖、渲染结果与 dry-run 安装路径。",
    "完整的 Chart 目录布局、values 模式、模板、钩子和依赖关系是否读取 `chart-structure` reference。",
  ],
  relatedSkills: [
    {
      get id() {
        return monitoringObservabilitySkill.id;
      },
      reason: "Chart 暴露指标、ServiceMonitor、探针或告警配置时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认服务类型、部署环境、镜像、网络、资源、安全、依赖项和是否需要从 Kubernetes manifest 收敛为 Chart。",
      "默认使用 apiVersion v2 的 application chart，并保留 Chart.yaml、values.yaml、templates/ 和必要 _helpers.tpl。",
      "values.yaml 按镜像、网络、资源、安全、依赖项分层；环境差异下沉到 values 文件，不复制模板。",
      "Chart.yaml 和 values.yaml 最小骨架优先复用 chart-yaml 与 values-yaml assets；复杂目录和模板模式读取 chart-structure。",
      "交付前运行 helm lint、模板渲染、dry-run 路径和 helm-chart-scaffolding-validate-chart procedure。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Chart 目录布局、Chart.yaml、values.yaml 分层、templates/_helpers.tpl 和依赖关系。",
      "资源限制、探针、安全上下文、ServiceAccount、Secret 外部引用和环境 values 策略。",
      "helm lint、渲染、dry-run、validate-chart 结果和监控/ServiceMonitor 联动项。",
    ],
  }),
  procedures: [
    procedureUse(helmChartScaffoldingValidateChart),
  ],
  references: [
    defineReference({
      id: "chart-structure",
      source: new URL("./references/chart-structure.md", import.meta.url),
      target: "references/chart-structure.md",
      title: "chart-structure.md",
      summary: "Helm Chart 目录结构、values 层级、模板最佳实践与 _helpers.tpl 模式。",
      loadWhen: "需要创建或审查 Helm Chart 的结构与 values 分层设计时读取。",
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
