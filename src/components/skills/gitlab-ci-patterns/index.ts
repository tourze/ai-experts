import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
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
      reason: "Helm 或 Kubernetes 发布可以衔接 `helm-chart-scaffolding`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
