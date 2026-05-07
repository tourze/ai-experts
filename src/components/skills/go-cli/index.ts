import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { goCodeStyleSkill } from "../go-code-style/index";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goErrorHandlingSkill } from "../go-error-handling/index";

export const goCliSkill = defineSkill({
  id: "go-cli",
  fullName: "go-cli",
  description: "当 Go 项目需要构建 CLI 应用：命令结构、flag 解析、配置分层、信号处理、退出码或 shell 补全时使用。",
  useCases: [
    "使用 Cobra 构建 CLI 命令结构（root + subcommands）。",
    "需要配置分层：默认值 → 配置文件 → 环境变量 → flags。",
    "需要信号处理与优雅停机（os/signal + context）。",
    "定义退出码约定或注入版本信息（-ldflags）。",
    "生成 shell 自动补全（Bash / Zsh / Fish / PowerShell）。",
  ],
  constraints: [
    "命令结构用 Cobra；配置管理用 Viper；两者通过 `viper.BindPFlag` 桥接，不要手写 flag 解析。",
    "配置按优先级覆盖：默认值 < 配置文件 < 环境变量 < 命令行 flags。",
    "退出码遵循 Unix 惯例：0 成功，1 一般错误，2 用法错误。不要自创退出码。",
    "版本信息通过 `-ldflags` 在构建时注入，不要硬编码。",
    "长运行命令必须捕获 SIGINT/SIGTERM 并通过 context 取消传播。",
    "每个 subcommand 独立文件，root command 在 `cmd/root.go`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "手写 flag 解析不用 Cobra。",
      pass: "用 `cobra.Command` 统一管理。",
    }),
    defineAntiPattern({
      fail: "配置文件覆盖命令行 flags。",
      pass: "调整优先级：flags > env > file > defaults。",
    }),
    defineAntiPattern({
      fail: "os.Exit() 在 deferred 函数之前调用。",
      pass: "Execute() 返回 error，在 main 里 exit。",
    }),
    defineAntiPattern({
      fail: "忽略 SIGTERM 导致容器强杀。",
      pass: "用 signal.NotifyContext + context 传播。",
    }),
    defineAntiPattern({
      fail: "版本号硬编码。",
      pass: "用 -ldflags -X 构建时注入。",
    }),
    defineAntiPattern({
      fail: "shell 补全不完整。",
      pass: "用 Cobra 内置 completion 子命令生成。",
    }),
  ],
  relatedSkills: [
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      reason: "相关 skill： 并发停机编排配合 `go-concurrency-patterns`； 错误语义设计配合 `go-error-handling`； 项目布局配合 `go-project-layout`。",
    },
    {
      get id() {
        return goCodeStyleSkill.id;
      },
      label: "go-project-layout",
      reason: "相关 skill： 并发停机编排配合 `go-concurrency-patterns`； 错误语义设计配合 `go-error-handling`； 项目布局配合 `go-project-layout`。",
    },
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "相关 skill：\\\\n并发停机编排配合 `go-concurrency-patterns`；\\\\n错误语义设计配合 `go-error-handling`；\\\\n项目布局配合 `go-project-layout`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 CLI 的入口、subcommand 层级、配置来源、环境变量前缀、退出码和发布方式。",
      "按 root command、subcommand 注册、flags / viper 配置绑定和信号处理建立骨架。",
      "明确用法错误、业务错误和中断退出的 exit code，版本号通过 ldflags 注入。",
      "常用代码模式读取 `cli-patterns`；Cobra / Viper 细节读取 `cobra-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "CLI 命令树、flags / config / env 优先级和退出码约定。",
      "Cobra / Viper 代码骨架、优雅停机和版本注入方案。",
      "需要补的测试、文档和发布命令。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "cli-patterns",
      source: new URL("./references/cli-patterns.md", import.meta.url),
      target: "references/cli-patterns.md",
      title: "Go CLI 代码模式",
      summary: "Cobra root command、subcommand 注册、Viper 配置绑定、信号处理、退出码和版本注入示例。",
      loadWhen: "需要快速搭建或审查 Go CLI 代码骨架时读取。",
    }),
    defineReference({
      id: "cobra-patterns",
      source: new URL("./references/cobra-patterns.md", import.meta.url),
      target: "references/cobra-patterns.md",
      title: "cobra-patterns.md",
      summary: "Cobra 命令结构、flag 绑定、PreRun/PostRun 钩子与子命令组织的模式。",
      loadWhen: "需要设计或审查 Cobra CLI 的命令树与参数定义时读取。",
    }),
  ],
});
