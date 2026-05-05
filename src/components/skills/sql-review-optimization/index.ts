import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
    "如果优化依赖具体数据库引擎特性，联动 `db-schema-design`。",
  ],
  constraints: [
    "**审查（先安全，再性能）**\n- 先审安全边界，再看性能；权限、条件或事务边界错了跑再快也没意义。\n- 用户输入必须经驱动参数化；不拼接、不内联。\n- 查询要显式列出返回列、连接条件和排序条件。\n- 迁移脚本必须评估锁、回填、回滚和灰度路径。\n- 评审覆盖读写放大、权限模型、审计和异常恢复。",
    "**优化（先测量，再优化）**\n- 先拿执行计划、真实行数、延迟和资源消耗，再决定改 SQL 还是改索引。\n- 优先修访问路径，再谈\"技巧重写\"；大多数慢查询输在过滤、排序和索引布局。\n- 热路径分页优先游标或 seek，避免大偏移 OFFSET。\n- 批处理、报表和在线请求资源模型不同，OLAP 查询不塞进 OLTP 热链路。\n- 复合索引顺序匹配过滤和排序路径，不按\"字段重要性\"拍脑袋。",
    "**深度索引策略**\n通用原则与 MySQL/PostgreSQL 特化策略见 [references/index-strategy.md](references/index-strategy.md)。详细方法论见 [references/sql-code-review.md](references/sql-code-review.md)、[references/sql-optimization.md](references/sql-optimization.md)。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "index-patterns",
      source: new URL("./references/index-patterns.md", import.meta.url),
      target: "references/index-patterns.md",
      title: "index-patterns.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "index-strategy",
      source: new URL("./references/index-strategy.md", import.meta.url),
      target: "references/index-strategy.md",
      title: "index-strategy.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mysql-index-strategy",
      source: new URL("./references/mysql-index-strategy.md", import.meta.url),
      target: "references/mysql-index-strategy.md",
      title: "mysql-index-strategy.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pgsql-index-strategy",
      source: new URL("./references/pgsql-index-strategy.md", import.meta.url),
      target: "references/pgsql-index-strategy.md",
      title: "pgsql-index-strategy.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "sql-code-review",
      source: new URL("./references/sql-code-review.md", import.meta.url),
      target: "references/sql-code-review.md",
      title: "sql-code-review.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "sql-optimization",
      source: new URL("./references/sql-optimization.md", import.meta.url),
      target: "references/sql-optimization.md",
      title: "sql-optimization.md",
      summary: "Reference material for sql-review-optimization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
