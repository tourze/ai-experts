import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pgsqlPartitioningSkill = defineSkill({
  id: "pgsql-partitioning",
  fullName: "PostgreSQL Declarative Partitioning",
  description: "当用户要设计或验证 PostgreSQL 声明式分区、分区裁剪或分区生命周期管理时使用。适用于时序和大表治理。",
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
      summary: "Reference material for pgsql-partitioning.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for pgsql-partitioning.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
