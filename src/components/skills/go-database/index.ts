import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const goDatabaseSkill = defineSkill({
  id: "go-database",
  description: "当 Go 代码涉及 SQL 查询、事务、连接池、NULLable 列扫描、migration 或数据库访问层设计时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "transactions",
      source: new URL("./references/transactions.md", import.meta.url),
      target: "references/transactions.md",
      title: "transactions.md",
      summary: "Reference material for go-database.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-database.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
