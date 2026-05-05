import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

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
    "相关 skill：\n并发停机编排配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；\n错误语义设计配合 [go-error-handling](../go-error-handling/SKILL.md)；\n项目布局配合 [go-project-layout](../go-code-style/SKILL.md)。",
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
      summary: "Reference material for go-cli.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
