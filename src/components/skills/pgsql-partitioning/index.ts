import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
      reason: "需要验证分区裁剪、索引设计或查询计划时联动。",
    },
    {
      get id() {
        return dbSchemaDesignSkill.id;
      },
      reason: "需要确定基础表结构、主键/唯一约束和分区键建模时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "没有 DEFAULT 分区",
      pass: "始终有兜底",
    }),
    defineAntiPattern({
      fail: "HASH 分区做时序",
      pass: "时序用 RANGE",
    }),
    defineAntiPattern({
      fail: "DETACH 不 CONCURRENTLY",
      pass: "CONCURRENTLY 滚动",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认数据增长模式、主要查询谓词、归档窗口和分区键；时序数据默认优先 RANGE 分区。",
      "父表主键和所有唯一约束必须包含分区键；RANGE 边界使用左闭右开并保持相邻无缝。",
      "创建 DEFAULT 分区兜底，并提前创建未来分区；旧分区归档/DETACH 时优先使用低锁策略。",
      "变更后用 `EXPLAIN` 验证 partition pruning 只扫描目标分区；完整 DDL 和管理脚本读取 code-patterns reference。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "父表、分区表、DEFAULT 分区、主键/唯一约束和索引 DDL。",
      "未来分区创建、旧分区 DETACH/归档、监控和异常插入兜底计划。",
      "`EXPLAIN` 裁剪证据、未裁剪查询风险和需要优化的谓词/索引。",
    ],
  }),
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "PostgreSQL 声明式分区的代码模式示例，包括 RANGE、LIST、HASH 分区和分区管理的完整实现。",
      loadWhen: "需要参考具体分区实现代码、编写分区管理脚本或验证分区方案正确性时读取。",
    }),
  ],
});
