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
  useCases: [
    "时序数据按时间 RANGE 分区，实现高效裁剪和历史归档",
    "多租户系统按 tenant_id 做 LIST 分区，实现租户级隔离",
    "单表超 1 亿行或 100 GB，需要改善查询和 VACUUM 效率",
    "需要验证分区裁剪是否生效（`EXPLAIN` 只扫描目标分区）",
    "基础表结构参见 [db-schema-design](../db-schema-design/SKILL.md)；索引策略参见 [sql-review-optimization](../sql-review-optimization/SKILL.md)",
  ],
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
  ],
});
