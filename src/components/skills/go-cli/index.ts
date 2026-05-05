import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const goCliSkill = defineSkill({
  id: "go-cli",
  description: "当 Go 项目需要构建 CLI 应用：命令结构、flag 解析、配置分层、信号处理、退出码或 shell 补全时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-cli.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
