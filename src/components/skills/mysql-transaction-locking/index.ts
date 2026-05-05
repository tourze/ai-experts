import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const mysqlTransactionLockingSkill = defineSkill({
  id: "mysql-transaction-locking",
  description: "当用户要诊断或优化 MySQL InnoDB 事务隔离、行锁、间隙锁、插入意向锁、自增锁或死锁时使用。适用于并发冲突排查。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for mysql-transaction-locking.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
