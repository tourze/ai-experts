# Partitioning 代码模式

## RANGE 分区 — 按月切分时序数据

```sql
CREATE TABLE event_log (
    id          BIGINT GENERATED ALWAYS AS IDENTITY,
    tenant_id   BIGINT       NOT NULL,
    event_type  TEXT         NOT NULL,
    payload     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE event_log_2025_01 PARTITION OF event_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE event_log_2025_02 PARTITION OF event_log
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE event_log_default PARTITION OF event_log DEFAULT;
```

## LIST 分区 — 按租户隔离

```sql
CREATE TABLE tenant_data (
    id          BIGINT GENERATED ALWAYS AS IDENTITY,
    tenant_id   BIGINT       NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (id, tenant_id)
) PARTITION BY LIST (tenant_id);

CREATE TABLE tenant_data_t1 PARTITION OF tenant_data FOR VALUES IN (1);
CREATE TABLE tenant_data_t2 PARTITION OF tenant_data FOR VALUES IN (2);
CREATE TABLE tenant_data_default PARTITION OF tenant_data DEFAULT;
```

## 分区生命周期维护脚本

```sql
-- 提前创建下个月分区（建议用 cron 每月执行）
DO $$
DECLARE
    next_start DATE := date_trunc('month', now()) + INTERVAL '1 month';
    next_end   DATE := next_start + INTERVAL '1 month';
    part_name  TEXT := 'event_log_' || to_char(next_start, 'YYYY_MM');
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF event_log
         FOR VALUES FROM (%L) TO (%L)',
        part_name, next_start, next_end
    );
END
$$;

-- 归档并解除旧分区
ALTER TABLE event_log DETACH PARTITION event_log_2024_06 CONCURRENTLY;
```

## 验证分区裁剪

```sql
EXPLAIN (COSTS OFF)
SELECT *
  FROM event_log
 WHERE created_at >= '2025-02-01'
   AND created_at <  '2025-03-01';

-- 期望输出只包含 event_log_2025_02
-- Append
--   ->  Seq Scan on event_log_2025_02
```
