import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const mysqlTransactionLockingSkill = defineSkill({
  id: "mysql-transaction-locking",
  fullName: "MySQL Transaction & Locking",
  description: "当用户要诊断或优化 MySQL InnoDB 事务隔离、行锁、间隙锁、插入意向锁、自增锁或死锁时使用。适用于并发冲突排查。",
  useCases: [
    "排查死锁告警，需要读懂 `SHOW ENGINE INNODB STATUS` 并定位根因。",
    "选择事务隔离级别，在 REPEATABLE READ 和 READ COMMITTED 之间做权衡。",
    "分析高并发场景下的锁等待和锁超时，减少事务持有锁的时间。",
    "正确使用 `SELECT ... FOR UPDATE` / `FOR SHARE`，避免丢失更新和幻读。",
    "解释 `lock_mode X locks gap before rec insert intention waiting`、`locks rec but not gap`、`AUTO-INC` 等锁日志。",
    "需要理解索引对锁范围的影响，联动 [sql-review-optimization](../sql-review-optimization/SKILL.md)（含深度索引策略）。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "locking-patterns",
      source: new URL("./references/locking-patterns.md", import.meta.url),
      target: "references/locking-patterns.md",
      title: "locking-patterns.md",
      summary: "Reference material for mysql-transaction-locking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
