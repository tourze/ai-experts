import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { helmChartScaffoldingSkill } from "../helm-chart-scaffolding/index";

export const gitlabCiPatternsSkill = defineSkill({
  id: "gitlab-ci-patterns",
  fullName: "GitLab CI/CD 模式",
  description: "当用户要设计、优化或排查 GitLab CI/CD 流水线时使用。",
  useCases: [
    "新建或重构 `.gitlab-ci.yml`。",
    "优化多阶段流水线的执行顺序、缓存和制品传递。",
    "设计从构建到部署的 GitLab Runner 流程。",
  ],
  constraints: [
    "优先使用 `rules:` 和 `needs:`，避免继续扩散遗留的 `only/except` 写法。",
    "基础镜像尽量固定版本，避免流水线漂移。",
    "凭据只能来自 GitLab CI Variables、Vault 或外部密钥系统。",
    "生产部署必须显式标记人工门禁或受保护分支。",
  ],
  checklist: [
    "是否明确 stage 顺序、`needs` 依赖和并行边界。",
    "是否区分缓存、制品和部署产物的生命周期。",
    "是否固定基础镜像版本，并限制 privileged runner 使用范围。",
    "是否为发布作业设置环境、审批和受保护分支条件。",
    "是否记录失败后需要保留的日志、报告和测试产物。",
  ],
  relatedSkills: [
    {
      get id() {
        return helmChartScaffoldingSkill.id;
      },
      reason: "流水线包含 Helm/Kubernetes 发布、Chart 校验或多环境部署时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "单 job 塞所有步骤",
      pass: "分 stage + needs 并行",
    }),
    defineAntiPattern({
      fail: "生产自动部署无门禁",
      pass: "手动门禁 + 环境",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认流水线目标、runner 类型、分支策略、制品生命周期、部署环境和失败后要保留的证据。",
      "按 lint、test、build、deploy 拆 stage，用 needs 表达并行依赖，不把所有步骤塞进单 job。",
      "优先使用 rules 和 needs；避免扩散 only/except；基础镜像固定版本。",
      "区分 cache、artifacts 和部署产物：cache 用于依赖复用，artifacts 用于跨 job 传递和审计保留。",
      "生产部署必须绑定 environment、protected branch、人工门禁或审批；Helm/Kubernetes 发布联动 helm-chart-scaffolding。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      ".gitlab-ci.yml 结构：stages、jobs、needs、rules、image、cache、artifacts 和 environments。",
      "执行顺序、并行边界、runner 权限、凭据来源、生产门禁和受保护分支条件。",
      "失败诊断、日志/报告/测试产物保留策略和 Helm/Kubernetes 发布衔接点。",
    ],
  }),
  tools: [],
});
