import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { mysqlTransactionLockingSkill } from "../mysql-transaction-locking/index";

export const dbHaReplicationSkill = defineSkill({
  id: "db-ha-replication",
  fullName: "Database HA & Replication",
  description: "当用户要配置或排查数据库主从复制、GTID、半同步、故障切换或读写分离高可用架构时使用。",
  useCases: [
    "搭建或审查基于 GTID 的主从复制拓扑，配置异步或半同步复制。",
    "实施读写分离架构，需要合理的 Replica 路由策略和延迟监控。",
    "规划或执行故障切换（计划内与非计划），需要确认 GTID 集合一致性。",
    "排查复制延迟、中断、数据不一致等运维问题。",
    "需要理解事务与锁对复制的影响，联动 `mysql-transaction-locking`。",
  ],
  constraints: [
    "必须启用 GTID（`gtid_mode=ON`、`enforce_gtid_consistency=ON`）；GTID 让故障切换位点对齐自动化。",
    "Binlog 格式必须 `ROW`；STATEMENT 格式在非确定性函数下导致主从不一致。",
    "高一致性场景必须开启半同步（`rpl_semi_sync_source_enabled`）；至少一个 Replica 确认收到后 Source 才提交。",
    "复制延迟监控使用 `Seconds_Behind_Source`（SHOW REPLICA STATUS）+ 心跳表双保险。",
    "故障切换前必须确认所有 Replica 的 GTID 集合一致，禁止在 GTID 有缺口时提升 Replica。\n\nMySQL 复制运维详细内容见：[references/mysql-replication-ops.md](references/mysql-replication-ops.md)、[references/replication-config.md](references/replication-config.md)。",
  ],
  relatedSkills: [
    {
      get id() {
        return mysqlTransactionLockingSkill.id;
      },
      reason: "需要理解事务与锁对复制的影响，联动 `mysql-transaction-locking`。",
    },
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
