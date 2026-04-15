---
name: pgsql-jsonb-patterns
description: "在 PostgreSQL 中正确使用 JSONB 存储、查询、索引与验证，适用于稀疏属性和半结构化数据"
---

# PostgreSQL JSONB Patterns

## 适用场景

- 业务实体有大量可选或多态属性，关系列建模会导致过多 NULL 列
- 需要在 JSONB 列上做高效查询，选择正确运算符（`@>`、`->`、`->>`、`?`）和索引
- 需要从 JSONB 提取标量做高频过滤，使用表达式索引或 generated column
- 需要对 JSONB 列结构做 CHECK 约束校验
- GIN 索引细节参见 [pgsql-index-strategy](../pgsql-index-strategy/SKILL.md)；高频列提升为关系列参见 [pgsql-schema-design](../pgsql-schema-design/SKILL.md)

## 核心约束

- 使用 `JSONB` 而非 `JSON`（JSONB 是二进制格式，支持索引；JSON 只是文本存储）
- 高频过滤或排序字段不放 JSONB 内 — 应提升为 generated column 或独立列
- GIN operator class 按需选：`jsonb_ops` 支持 `@>`/`?`/`?|`/`?&`；`jsonb_path_ops` 只支持 `@>` 但更紧凑
- JSONB 列必须有 CHECK 约束验证顶层类型（`jsonb_typeof(...) = 'object'`）
- 嵌套控制在 3 层以内，深层数据有提取为关系列的计划

## 代码模式

详细示例参见 [references/code-patterns.md](./references/code-patterns.md)。核心模板：

```sql
CREATE TABLE product (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       TEXT  NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb
                     CHECK (jsonb_typeof(attributes) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_attrs ON product USING gin (attributes jsonb_path_ops);
```

## 检查清单

- JSONB 列是否有 CHECK 约束验证顶层类型
- 高频过滤字段是否已提升为 generated column 或独立列
- GIN operator class 是否与查询运算符匹配
- 查询是否使用能触发 GIN 的运算符（`@>`/`?`），而非 `->>` + `LIKE`
- 嵌套是否控制在 3 层以内

## 反模式

- 用 `JSON` 代替 `JSONB` — 不支持索引、不支持相等比较
- 高频过滤列放 JSONB 内不建表达式索引 — 每次全表扫描 + JSON 解析
- 在 JSONB 上建 B-tree — 无法加速 `@>`/`?`，应用 GIN
- 用 `->>` + `LIKE '%keyword%'` — 无法走 GIN，应考虑全文搜索或 trigram
- 不对 JSONB 做 CHECK — 写入 null/数组/空文档导致下游崩溃
