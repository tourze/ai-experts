import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { dbSchemaDesignSkill } from "../db-schema-design/index";
import { sqlReviewOptimizationSkill } from "../sql-review-optimization/index";

export const pgsqlPartitioningSkill = defineSkill({
  id: "pgsql-partitioning",
  fullName: "PostgreSQL Declarative Partitioning",
  description: "当用户要设计或验证 PostgreSQL 声明式分区、分区裁剪或分区生命周期管理时使用。适用于时序和大表治理。",
  useCases: [
    "时序数据按时间 RANGE 分区，实现高效裁剪和历史归档",
    "多租户系统按 tenant_id 做 LIST 分区，实现租户级隔离",
    "单表超 1 亿行或 100 GB，需要改善查询和 VACUUM 效率",
    "需要验证分区裁剪是否生效（`EXPLAIN` 只扫描目标分区）",
    "基础表结构参见 `db-schema-design`；索引策略参见 `sql-review-optimization`",
  ],
  constraints: [
    "分区键必须包含在主键和所有唯一约束中",
    "始终创建 `DEFAULT` 分区兜底，防止插入不匹配数据时报错",
    "RANGE 边界使用左闭右开（`FROM ... TO ...`），相邻分区无缝无重叠",
    "DETACH 旧分区使用 `CONCURRENTLY` 避免 `ACCESS EXCLUSIVE` 长锁",
    "变更后必须用 `EXPLAIN` 验证 partition pruning 生效",
  ],
  checklist: [
    "分区键是否包含在主键和所有唯一约束中",
    "是否创建了 DEFAULT 分区",
    "RANGE 边界是否左闭右开且相邻无缝",
    "是否有自动化脚本提前创建未来分区",
    "是否用 `EXPLAIN` 验证 partition pruning 只访问目标分区",
  ],
  relatedSkills: [
    {
      get id() {
        return sqlReviewOptimizationSkill.id;
      },
      reason: "基础表结构参见 `db-schema-design`；索引策略参见 `sql-review-optimization`。",
    },
    {
      get id() {
        return dbSchemaDesignSkill.id;
      },
      reason: "基础表结构参见 `db-schema-design`；索引策略参见 `sql-review-optimization`",
    },
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
