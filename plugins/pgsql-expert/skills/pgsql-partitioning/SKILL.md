---
name: pgsql-partitioning
description: "当用户要设计或验证 PostgreSQL 声明式分区、分区裁剪或分区生命周期管理时使用。适用于时序和大表治理。"
---

# PostgreSQL Declarative Partitioning

## 适用场景

- 时序数据按时间 RANGE 分区，实现高效裁剪和历史归档
- 多租户系统按 tenant_id 做 LIST 分区，实现租户级隔离
- 单表超 1 亿行或 100 GB，需要改善查询和 VACUUM 效率
- 需要验证分区裁剪是否生效（`EXPLAIN` 只扫描目标分区）
- 基础表结构参见 [pgsql-schema-design](../pgsql-schema-design/SKILL.md)；分区索引参见 [pgsql-index-strategy](../pgsql-index-strategy/SKILL.md)

## 核心约束

- 分区键必须包含在主键和所有唯一约束中
- 始终创建 `DEFAULT` 分区兜底，防止插入不匹配数据时报错
- RANGE 边界使用左闭右开（`FROM ... TO ...`），相邻分区无缝无重叠
- DETACH 旧分区使用 `CONCURRENTLY` 避免 `ACCESS EXCLUSIVE` 长锁
- 变更后必须用 `EXPLAIN` 验证 partition pruning 生效

## 代码模式

详细示例参见 [references/code-patterns.md](./references/code-patterns.md)。核心模板：

```sql
CREATE TABLE event_log (
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE event_log_2025_01 PARTITION OF event_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE event_log_default PARTITION OF event_log DEFAULT;
```

## 检查清单

- 分区键是否包含在主键和所有唯一约束中
- 是否创建了 DEFAULT 分区
- RANGE 边界是否左闭右开且相邻无缝
- 是否有自动化脚本提前创建未来分区
- 是否用 `EXPLAIN` 验证 partition pruning 只访问目标分区

## 反模式

- 分区键不在主键中 — PostgreSQL 直接拒绝建表
- 不建 DEFAULT 分区 — 数据超出范围时 INSERT 报错阻塞业务
- 分区过细（按小时分百万级表） — 过多子表导致 planner 耗时剧增
- 用 HASH 分区做时序数据 — HASH 无法范围裁剪，时序应用 RANGE
- DETACH 不加 `CONCURRENTLY` — 高并发表上获取排他锁阻塞所有读写
