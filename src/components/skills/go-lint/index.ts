import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const goLintSkill = defineSkill({
  id: "go-lint",
  fullName: "go-lint",
  description: "当 Go 项目需要配置或使用 golangci-lint、理解 linter 规则、抑制误报、或在 CI 中集成 lint 时使用。",
  useCases: [
    "在 Go 项目中引入或调整 `golangci-lint` 配置（`.golangci.yml`）。",
    "排查 lint 报错、选择启用/禁用哪些 linter、理解某条规则的意义。",
    "需要用 `//nolint` 抑制告警，或评估是否应该全局禁用某个 linter。",
    "在 CI/CD 流水线中集成 `golangci-lint` 作为 PR 门禁。",
    "代码审查中讨论 lint 相关的代码质量问题。",
  ],
  constraints: [
    "**golangci-lint 是唯一推荐的 meta-linter**：不要单独安装 `gometalinter` 或手动逐个运行 linter。",
    "**不要因为一处违规模而全局禁用 linter**：用行级 `//nolint` 精准抑制，并附带 linter 名称和原因。",
    "**lint 必须在 CI 中运行**：PR 检查至少包含 `golangci-lint run`，阻止新问题合入。",
    "**先修复，后抑制**：看到告警优先修复代码，`//nolint` 是最后手段。",
    "**配置文件纳入版本控制**：`.golangci.yml` 放在仓库根目录，团队共享同一份配置。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全局禁用 linter 只因一个文件违规。",
      pass: "用行级 `//nolint:<linter> // <原因>` 精准抑制。",
    }),
    defineAntiPattern({
      fail: "//nolint 不带 linter 名称。",
      pass: "必须指定：`//nolint:gosec`，避免掩盖其他问题。",
    }),
    defineAntiPattern({
      fail: "CI 中不设 timeout 导致卡死。",
      pass: "设置 run.timeout: 5m 或命令行 --timeout=5m。",
    }),
    defineAntiPattern({
      fail: "同时启用 gofmt 和 gofumpt。",
      pass: "只保留 gofumpt，它是 gofmt 的超集。",
    }),
    defineAntiPattern({
      fail: "修改配置后不验证。",
      pass: "运行 `golangci-lint config verify` 检查配置合法性。",
    }),
    defineAntiPattern({
      fail: "在 generated 文件上跑 lint。",
      pass: "用 `exclude-generated` 或 `skip-dirs` 排除。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 Go 版本、CI 时限、已有 lint 报告、允许的规则集和渐进收敛策略。",
      "从最小可用 golangci 配置开始，启用 errcheck、govet、staticcheck、revive、gosec、gofmt / gofumpt 等核心规则。",
      "`nolint` 必须指定 linter 和原因，支持自动修复的规则先运行 `--fix`。",
      "配置模板和抑制示例读取 `golangci-guide`；完整规则参考读取 `linter-reference`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "golangci-lint 配置、启用规则和 CI 运行策略。",
      "需要修复、抑制或分阶段处理的 lint 发现。",
      "自动修复命令、剩余风险和基线收敛计划。",
    ],
  }),
  references: [
    defineReference({
      id: "golangci-guide",
      source: new URL("./references/golangci-guide.md", import.meta.url),
      target: "references/golangci-guide.md",
      title: "Go golangci-lint 配置指南",
      summary: "最小 .golangci.yml、精准 nolint、GitHub Actions 集成和 --fix 示例。",
      loadWhen: "需要快速配置或审查 golangci-lint 基线时读取。",
    }),
    defineReference({
      id: "linter-reference",
      source: new URL("./references/linter-reference.md", import.meta.url),
      target: "references/linter-reference.md",
      title: "linter-reference.md",
      summary: "golangci-lint 配置项、常用 linter 规则说明与 //nolint 抑制指南。",
      loadWhen: "需要配置 golangci-lint 或理解某条 linter 规则的含义时读取。",
    }),
  ],
});
