import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const dbHaReplicationSkill = defineSkill({
  id: "db-ha-replication",
  description: "当用户要配置或排查数据库主从复制、GTID、半同步、故障切换或读写分离高可用架构时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "mysql-replication-ops",
      source: new URL("./references/mysql-replication-ops.md", import.meta.url),
      target: "references/mysql-replication-ops.md",
      title: "mysql-replication-ops.md",
      summary: "Reference material for db-ha-replication.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "replication-config",
      source: new URL("./references/replication-config.md", import.meta.url),
      target: "references/replication-config.md",
      title: "replication-config.md",
      summary: "Reference material for db-ha-replication.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for db-ha-replication.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
