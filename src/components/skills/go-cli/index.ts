import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
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
