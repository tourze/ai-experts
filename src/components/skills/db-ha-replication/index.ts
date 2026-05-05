import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  checklist: [
    "GTID 是否已启用且 enforce_gtid_consistency=ON。",
    "Binlog 格式是否为 ROW。",
    "半同步复制是否在高一致性路径上启用。",
    "复制延迟监控是否同时使用 Seconds_Behind_Source 和心跳表。",
    "故障切换预案是否覆盖 GTID 缺口检测和 Replica 提升流程。",
    "读写分离路由是否考虑了复制延迟容忍度。",
  ],
  relatedSkills: [
    {
      get id() {
        return mysqlTransactionLockingSkill.id;
      },
      reason: "需要理解事务与锁对复制的影响，联动 `mysql-transaction-locking`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "使用 STATEMENT binlog 格式导致主从数据不一致。",
      pass: "使用 ROW binlog，并把复制格式纳入环境基线检查。",
    }),
    defineAntiPattern({
      fail: "不启用 GTID 导致故障切换时需要手动对齐位点。",
      pass: "启用 GTID，并演练基于 GTID 的故障切换。",
    }),
    defineAntiPattern({
      fail: "只依赖 SHOW REPLICA STATUS 的 Seconds_Behind_Source 判断延迟（无法检测无写入时的静默延迟）。",
      pass: "结合心跳表、复制位点和业务写入延迟判断真实延迟。",
    }),
    defineAntiPattern({
      fail: "在 GTID 有缺口时直接提升 Replica。",
      pass: "先补齐或确认缺口可接受，再执行提升。",
    }),
    defineAntiPattern({
      fail: "半同步降级为异步后不做告警。",
      pass: "半同步降级必须告警，并声明降级后的 RPO 处置流程。",
    }),
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
