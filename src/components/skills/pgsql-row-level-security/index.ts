import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pgsqlRowLevelSecuritySkill = defineSkill({
  id: "pgsql-row-level-security",
  fullName: "PostgreSQL Row-Level Security",
  description: "当用户要实现或审查 PostgreSQL 行级安全策略、多租户隔离或角色权限管理时使用。适用于共享表的数据边界控制。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "Reference material for pgsql-row-level-security.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for pgsql-row-level-security.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
