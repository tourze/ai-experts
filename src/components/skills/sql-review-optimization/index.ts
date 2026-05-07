import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { dbSchemaDesignSkill } from "../db-schema-design/index";

export const sqlReviewOptimizationSkill = defineSkill({
  id: "sql-review-optimization",
  fullName: "SQL Review & Optimization",
  description: "当用户要审查 SQL 安全性、正确性与运维风险，或分析 slow query、EXPLAIN 执行计划、索引调优（含深度索引策略）、join order、分页策略时使用。",
  useCases: [
    "审查手写 SQL、迁移脚本、存储过程和 ORM 生成语句的安全性、正确性和可运维性。",
    "排查 SQL 注入、权限过宽、误删误更新、联表错误、索引误用、迁移锁表风险。",
    "排查慢查询、索引缺失、回表过多、排序退化、批处理低效、分页越来越慢等性能问题。",
    "基于执行计划、行数估算、锁等待和数据分布决定优化方向。",
    "深度索引设计：索引类型选择（B-tree / GIN / GiST / BRIN）、复合索引列顺序、EXPLAIN 解读与索引维护。",
  ],
  constraints: [
    "**审查（先安全，再性能）**\n- 先审安全边界，再看性能；权限、条件或事务边界错了跑再快也没意义。\n- 用户输入必须经驱动参数化；不拼接、不内联。\n- 查询要显式列出返回列、连接条件和排序条件。\n- 迁移脚本必须评估锁、回填、回滚和灰度路径。\n- 评审覆盖读写放大、权限模型、审计和异常恢复。",
    "**优化（先测量，再优化）**\n- 先拿执行计划、真实行数、延迟和资源消耗，再决定改 SQL 还是改索引。\n- 优先修访问路径，再谈\"技巧重写\"；大多数慢查询输在过滤、排序和索引布局。\n- 热路径分页优先游标或 seek，避免大偏移 OFFSET。\n- 批处理、报表和在线请求资源模型不同，OLAP 查询不塞进 OLTP 热链路。\n- 复合索引顺序匹配过滤和排序路径，不按\"字段重要性\"拍脑袋。",
    "**深度索引策略**\n通用原则与 MySQL/PostgreSQL 特化策略读取 `index-strategy`、`mysql-index-strategy`、`pgsql-index-strategy` references；审查和优化方法论读取 `sql-code-review` 与 `sql-optimization` references。",
  ],
  checklist: [
    "审查：所有用户输入是否通过参数化绑定，是否存在拼接或内联。",
    "审查：DELETE/UPDATE/DROP 是否有限制条件（WHERE/LIMIT）和事务边界。",
    "审查：迁移脚本是否评估了锁范围、回填策略和回滚路径。",
    "审查：查询是否显式列出列名、连接条件和排序条件。",
    "审查：权限模型是否满足最小权限原则。",
    "优化：是否已获取 EXPLAIN / EXPLAIN ANALYZE 输出，type/key/Extra 是否达到预期。",
    "优化：执行计划是否出现全表扫描、文件排序、临时表或嵌套循环大表。",
    "优化：索引是否匹配 WHERE / JOIN / ORDER BY 的实际访问路径。",
    "优化：复合索引列顺序是否匹配查询的过滤 → 排序路径。",
    "优化：大偏移分页是否已改为游标/seek 分页。",
    "优化：批处理是否避免了逐行操作和 N+1 查询。",
    "优化：PostgreSQL：部分索引 WHERE 是否与查询一致；GIN/GiST 是否匹配运算符。",
    "优化：MySQL：前缀索引是否阻碍 ORDER BY 或覆盖索引场景。",
  ],
  relatedSkills: [
    {
      get id() {
        return dbSchemaDesignSkill.id;
      },
      reason: "如果优化依赖具体数据库引擎特性，联动 `db-schema-design`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不读执行计划就改 SQL 或加索引。",
      pass: "先读 EXPLAIN/ANALYZE 和真实基数，再决定改 SQL 或索引。",
    }),
    defineAntiPattern({
      fail: "用 DISTINCT 掩盖错误的 JOIN 条件。",
      pass: "修正 JOIN 条件和数据基数，避免用 DISTINCT 掩盖重复。",
    }),
    defineAntiPattern({
      fail: "在 WHERE 的索引列上套函数导致索引失效。",
      pass: "把函数移到参数侧、增加表达式索引，或改写谓词。",
    }),
    defineAntiPattern({
      fail: "把报表查询直接跑在 OLTP 主库上。",
      pass: "把报表迁到只读副本、数仓或异步汇总表。",
    }),
    defineAntiPattern({
      fail: "SELECT * 并依赖列序号取数据。",
      pass: "显式列出需要字段，并按列名读取。",
    }),
    defineAntiPattern({
      fail: "用应用程序循环逐行处理而不是集合操作。",
      pass: "用 SQL 集合操作、批处理或窗口函数下推计算。",
    }),
    defineAntiPattern({
      fail: "每个查询各建一个索引，导致索引膨胀和写入性能下降。",
      pass: "按查询族设计复合索引，定期清理低价值索引。",
    }),
    defineAntiPattern({
      fail: "在 TEXT/JSONB 大列上建普通索引而不是 GIN 或前缀索引。",
      pass: "TEXT 用前缀/全文索引，JSONB 用 GIN 或表达式索引。",
    }),
    defineAntiPattern({
      fail: "PostgreSQL 上用 B-tree 替代 GIN 处理 `@>` 等运算符。",
      pass: "使用适合操作符的 GIN/jsonb_path_ops 索引。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "审查 SQL 的安全性、正确性、可运维性和性能，并基于执行计划、真实基数、锁风险和数据分布制定优化方案。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "审查先看安全边界和正确性，再谈性能；权限、条件或事务边界错了，查询跑得快也不能放行。",
      "优化先拿 EXPLAIN/EXPLAIN ANALYZE、真实行数、延迟、锁等待和资源消耗，再决定改 SQL、改索引或改执行位置。",
      "代码模式优先读取 code-patterns；索引模式读取 index-patterns；深度索引读取 index-strategy 及数据库特化 reference。",
      "逐项检查参数化、显式列、JOIN 条件、WHERE/ORDER BY 访问路径、复合索引顺序、分页方式、批处理和 N+1。",
      "迁移脚本必须评估锁范围、回填、回滚、灰度和审计恢复路径；报表查询不得塞进 OLTP 热链路。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "SQL 审查发现：安全边界、参数化、权限、事务、迁移锁和正确性风险。",
      "执行计划解读、访问路径、索引设计、分页/批处理优化和数据库引擎特化建议。",
      "变更影响、回滚/灰度/监控方案，以及需要 db-schema-design 联动的 schema 或引擎约束。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "SQL 审查中常见代码模式示例，包含安全写法、性能友好模式和反模式对照。",
      loadWhen: "需要 SQL 审查中的代码模式参考或安全写法示例时读取。",
    }),
    defineReference({
      id: "index-patterns",
      source: new URL("./references/index-patterns.md", import.meta.url),
      target: "references/index-patterns.md",
      title: "index-patterns.md",
      summary: "常见 SQL 查询模式的索引策略示例，包含 B-tree、GIN、GiST 的选择依据。",
      loadWhen: "需要为特定查询模式选择合适的索引类型时读取。",
    }),
    defineReference({
      id: "index-strategy",
      source: new URL("./references/index-strategy.md", import.meta.url),
      target: "references/index-strategy.md",
      title: "index-strategy.md",
      summary: "通用深度索引策略，包含复合索引列顺序、覆盖索引和索引维护方法。",
      loadWhen: "需要设计或优化深度索引策略时读取。",
    }),
    defineReference({
      id: "mysql-index-strategy",
      source: new URL("./references/mysql-index-strategy.md", import.meta.url),
      target: "references/mysql-index-strategy.md",
      title: "mysql-index-strategy.md",
      summary: "MySQL 特有的索引策略，包含前缀索引、B-tree 特性和优化器行为。",
      loadWhen: "需要在 MySQL 环境下设计索引或排查索引失效原因时读取。",
    }),
    defineReference({
      id: "pgsql-index-strategy",
      source: new URL("./references/pgsql-index-strategy.md", import.meta.url),
      target: "references/pgsql-index-strategy.md",
      title: "pgsql-index-strategy.md",
      summary: "PostgreSQL 特有的索引策略，包含 GIN、GiST、BRIN、部分索引和表达式索引。",
      loadWhen: "需要在 PostgreSQL 环境下设计索引或选择适合操作符的索引类型时读取。",
    }),
    defineReference({
      id: "sql-code-review",
      source: new URL("./references/sql-code-review.md", import.meta.url),
      target: "references/sql-code-review.md",
      title: "sql-code-review.md",
      summary: "SQL 代码审查的完整方法论，覆盖安全性、正确性、可运维性和性能检查。",
      loadWhen: "需要执行系统性的 SQL 代码审查或建立审查规范时读取。",
    }),
    defineReference({
      id: "sql-optimization",
      source: new URL("./references/sql-optimization.md", import.meta.url),
      target: "references/sql-optimization.md",
      title: "sql-optimization.md",
      summary: "SQL 性能优化的详细方法论，包含执行计划解读、访问路径分析和重写策略。",
      loadWhen: "需要分析慢查询或基于执行计划制定优化方案时读取。",
    }),
  ],
});
