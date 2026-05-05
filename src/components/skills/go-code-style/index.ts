import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goCodeStyleSkill = defineSkill({
  id: "go-code-style",
  fullName: "go-code-style",
  description: "当 Go 代码需要风格、可读性、文件组织、函数签名或惯用写法判断时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "documentation",
      source: new URL("./references/documentation.md", import.meta.url),
      target: "references/documentation.md",
      title: "documentation.md",
      summary: "Reference material for go-code-style.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-code-style.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
