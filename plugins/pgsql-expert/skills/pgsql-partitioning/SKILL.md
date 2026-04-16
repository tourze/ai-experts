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

### FAIL: 没有 DEFAULT 分区

```sql
CREATE TABLE event_log (...) PARTITION BY RANGE (created_at);
CREATE TABLE event_log_2026_01 PARTITION OF event_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- 2026-02-01 0:00:01 的写入：
INSERT INTO event_log (created_at, ...) VALUES ('2026-02-01 00:00:01', ...);
-- ERROR: no partition of relation "event_log" found for row
-- 业务整夜阻塞
```

### PASS: 始终有兜底

```sql
CREATE TABLE event_log_default PARTITION OF event_log DEFAULT;
-- 自动化任务每月提前创建下个月分区
-- 即使忘了，DEFAULT 兜住，事后再 ATTACH 真实分区
```

### FAIL: HASH 分区做时序

```sql
CREATE TABLE metrics (...) PARTITION BY HASH (id);
SELECT * FROM metrics WHERE created_at > now() - interval '1 hour';
-- planner 必须扫所有 HASH 分区，无范围裁剪
-- 比未分区还慢
```

### PASS: 时序用 RANGE

```sql
CREATE TABLE metrics (...) PARTITION BY RANGE (created_at);
SELECT * FROM metrics WHERE created_at > now() - interval '1 hour';
-- EXPLAIN 只扫描最近一两个分区
```

### FAIL: DETACH 不 CONCURRENTLY

```sql
ALTER TABLE event_log DETACH PARTITION event_log_2024_01;
-- 获取 ACCESS EXCLUSIVE 锁，阻塞所有读写
-- 高并发表上一卡就是几秒到几十秒
```

### PASS: CONCURRENTLY 滚动

```sql
ALTER TABLE event_log DETACH PARTITION event_log_2024_01 CONCURRENTLY;
-- 不阻塞读写，分两阶段完成
```
