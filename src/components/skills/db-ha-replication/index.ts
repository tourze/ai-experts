import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const dbHaReplicationSkill = defineSkill({
  id: "db-ha-replication",
  fullName: "Database HA & Replication",
  description: "当用户要配置或排查数据库主从复制、GTID、半同步、故障切换或读写分离高可用架构时使用。",
  useCases: [
    "搭建或审查基于 GTID 的主从复制拓扑，配置异步或半同步复制。",
    "实施读写分离架构，需要合理的 Replica 路由策略和延迟监控。",
    "规划或执行故障切换（计划内与非计划），需要确认 GTID 集合一致性。",
    "排查复制延迟、中断、数据不一致等运维问题。",
    "需要理解事务与锁对复制的影响，联动 [mysql-transaction-locking](../mysql-transaction-locking/SKILL.md)。",
  ],
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
  ],
});
