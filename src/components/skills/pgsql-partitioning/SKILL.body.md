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
