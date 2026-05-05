import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { sqlReviewOptimizationSkill } from "../sql-review-optimization/index";

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
    "需要理解索引对锁范围的影响，联动 `sql-review-optimization`（含深度索引策略）。",
  ],
  constraints: [
    "InnoDB 默认 REPEATABLE READ，搜索或扫描索引时通常使用 Next-Key Lock（记录锁 + 前一段间隙锁），可能锁定比预期更大的范围。",
    "唯一索引等值命中唯一已存在记录时通常只加记录锁；范围查询、非唯一索引、未命中记录和扫描型语句更容易引入 gap / next-key 锁。",
    "READ COMMITTED 会关闭搜索和索引扫描中的 gap locking，降低并发写入冲突，但外键约束检查和重复键检查仍会使用 gap locking；不要写成“完全没有间隙锁”。",
    "事务必须尽快提交或回滚；长事务持有锁阻塞其他会话，且阻止 undo log 清理导致 history list 膨胀。",
    "`SELECT ... FOR UPDATE` 必须在事务内且命中索引；无索引时会锁住扫描到的大量索引记录，效果上接近全表阻塞，但不是 MySQL 表锁。",
    "`AUTO-INC` 锁模式和版本相关：MySQL 8.0 默认 `innodb_autoinc_lock_mode=2`，MySQL 5.7 默认 `1`；statement-based replication 需要用 `0` 或 `1` 保持自增值可重放顺序。",
    "应用层必须捕获 deadlock 错误（error 1213）并自动重试，InnoDB 会回滚代价较小的事务。",
  ],
  relatedSkills: [
    {
      get id() {
        return sqlReviewOptimizationSkill.id;
      },
      reason: "需要理解索引对锁范围的影响，联动 `sql-review-optimization`（含深度索引策略）。",
    },
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
