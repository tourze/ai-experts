import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { sqlReviewOptimizationSkill } from "../sql-review-optimization/index";

export const dbSchemaDesignSkill = defineSkill({
  id: "db-schema-design",
  fullName: "Database Schema Design",
  description: "当用户要设计或审查数据库表结构、列类型、约束、字符集、JSON 列或半结构化数据建模时使用。",
  useCases: [
    "新建或变更业务表，需要确定列类型、主键策略、字符集与约束。",
    "审查 CREATE TABLE 语句的类型精度、约束完整性和默认值合理性。",
    "表含稀疏或半结构化属性，需判断用 JSON/JSONB 列还是范式化。",
    "对 JSON 内部字段建索引以支持查询过滤。",
    "与索引设计联动，为索引打好列基础，联动 `sql-review-optimization`（含深度索引策略）。",
    "与 SQL 调优联动，表结构决定查询路径的上限，联动 `sql-review-optimization`。",
  ],
  constraints: [
    "**通用原则**\n- 业务允许的列显式 `NOT NULL DEFAULT ...`；可空列增加索引和优化器负担。\n- 金额必须精确数值类型，禁止 FLOAT/DOUBLE。\n- 所有表必须有明确的主键和存储引擎选择。",
    "**MySQL 特化**\n- 主键必须 `BIGINT UNSIGNED AUTO_INCREMENT`；禁止 INT（溢出风险）和 UUID 聚簇索引（页分裂、写放大）。\n- 字符集统一 `utf8mb4`，排序规则优先 `utf8mb4_0900_ai_ci`；禁止 `utf8`（不能存 4 字节字符）。\n- 引擎默认 InnoDB；选择其他引擎须在注释中说明理由。\n- JSON 列不能有默认值、不能做主键；高频过滤/排序字段必须提取为生成列（VIRTUAL/STORED）并建索引。\n- 使用 `->>` 获取无引号文本值；JSON 数组场景优先评估多值索引（MySQL 8.0.17+）。",
    "**PostgreSQL 特化**\n- 主键用 `BIGINT GENERATED ALWAYS AS IDENTITY`，不用 `serial`。\n- 时间列一律 `TIMESTAMPTZ`，禁止裸 `timestamp`。\n- 通用字符串用 `TEXT`，不用 `varchar(n)`（内部存储无差异）。\n- 标识符用 unquoted snake_case，禁止 `\"QuotedCamelCase\"`。\n- 使用 `JSONB` 而非 `JSON`（JSONB 支持索引，JSON 只是文本存储）。\n- JSONB 列必须有 CHECK 约束验证顶层类型；嵌套控制在 3 层以内。\n\n详细引擎专有模式见：[references/mysql-schema-design.md](references/mysql-schema-design.md)、[references/pgsql-schema-design.md](references/pgsql-schema-design.md)、[references/mysql-json-generated-columns.md](references/mysql-json-generated-columns.md)、[references/pgsql-jsonb-patterns.md](references/pgsql-jsonb-patterns.md)。",
  ],
  checklist: [
    "主键策略是否匹配引擎特性（InnoDB 聚簇 / PostgreSQL identity）。",
    "金额列是否使用精确数值类型。",
    "字符集和排序规则是否统一（MySQL utf8mb4 / PostgreSQL 默认 UTF-8）。",
    "nullable 列是否有合理的 DEFAULT 值。",
    "JSON/JSONB 列是否有 CHECK 约束，高频过滤字段是否提取为生成列。",
    "标识符命名是否统一（snake_case）且避免了保留字。",
    "外键是否显式声明（PostgreSQL）或在应用层有约束保证（MySQL）。",
  ],
  relatedSkills: [
    {
      get id() {
        return sqlReviewOptimizationSkill.id;
      },
      reason: "与 SQL 调优联动，表结构决定查询路径的上限，联动 `sql-review-optimization`。",
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
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "json-patterns",
      source: new URL("./references/json-patterns.md", import.meta.url),
      target: "references/json-patterns.md",
      title: "json-patterns.md",
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mysql-json-generated-columns",
      source: new URL("./references/mysql-json-generated-columns.md", import.meta.url),
      target: "references/mysql-json-generated-columns.md",
      title: "mysql-json-generated-columns.md",
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mysql-schema-design",
      source: new URL("./references/mysql-schema-design.md", import.meta.url),
      target: "references/mysql-schema-design.md",
      title: "mysql-schema-design.md",
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pgsql-jsonb-patterns",
      source: new URL("./references/pgsql-jsonb-patterns.md", import.meta.url),
      target: "references/pgsql-jsonb-patterns.md",
      title: "pgsql-jsonb-patterns.md",
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pgsql-schema-design",
      source: new URL("./references/pgsql-schema-design.md", import.meta.url),
      target: "references/pgsql-schema-design.md",
      title: "pgsql-schema-design.md",
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "type-selection",
      source: new URL("./references/type-selection.md", import.meta.url),
      target: "references/type-selection.md",
      title: "type-selection.md",
      summary: "Reference material for db-schema-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
