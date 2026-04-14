---
name: postgresql-table-design
description: 设计和审查 PostgreSQL 表结构、类型、约束、索引与分区策略，适用于利用 PG 原生特性的模式设计
---

# PostgreSQL Table Design

## 适用场景

- 新建或审查 PostgreSQL 业务表、索引、约束、分区和 JSONB 结构。
- 需要决定 `BIGINT IDENTITY`、`UUID`、`JSONB`、部分索引、表达式索引、GIN/GiST 的取舍。
- 排查 PostgreSQL 特有问题，如外键列未建索引、大小写标识符、错误的数据类型选择、分区失效等。
- 如果目标是通用 SQL 调优，联动 [sql-optimization](../sql-optimization/SKILL.md)；如果目标是安全和正确性审查，联动 [sql-code-review](../sql-code-review/SKILL.md)。

## 核心约束

- 标识符默认使用未加引号的 `snake_case`；不要引入混合大小写对象名。
- 常规主键优先 `BIGINT GENERATED ALWAYS AS IDENTITY`；只有明确需要跨系统全局唯一或外部暴露时再考虑 `UUID`。
- 外键列不会自动建索引，必须手动补齐，否则删除父表行和联表查询都容易退化。
- 时间优先 `TIMESTAMPTZ`，金额优先 `NUMERIC`，可变字符串优先 `TEXT`；不要默认使用 `serial`、`timestamp` 或任意 `varchar(n)`。
- `JSONB` 只用于可选和稀疏属性；高频标量过滤要抽出常规列或表达式索引，不要把所有条件都压进 JSONB。

## 代码模式

```sql
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_uq ON users (LOWER(email));
```

```sql
CREATE TABLE orders (
    order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_pending_created_idx ON orders (created_at DESC) WHERE status = 'pending';
```

```sql
CREATE TABLE profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(user_id),
    attrs JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX profiles_attrs_gin_idx ON profiles USING GIN (attrs);
```

## 检查清单

- 主键、唯一约束、外键和 `NOT NULL` 是否表达了真实业务边界，而不是把校验都推给应用层。
- 外键列、表达式过滤列和热点状态过滤列是否具备与查询路径匹配的索引。
- 是否正确使用 `TIMESTAMPTZ`、`NUMERIC`、`TEXT`、`JSONB`，避免把别的数据库习惯直接搬进 PostgreSQL。
- 分区是否基于明确的裁剪收益或生命周期管理目标，而不是“表大了就先分区”。
- 如果表承载租户或权限边界，是否需要行级安全、视图隔离或更严格的 schema ownership。

## 反模式

- 以为 PostgreSQL 会像某些数据库一样自动为外键建索引，结果删除父记录时锁表。
- 使用带引号的 `"UserId"`、`"CreatedAt"`，把后续所有 SQL 都变成大小写陷阱。
- 把所有动态属性塞进 `JSONB`，却没有 GIN 或表达式索引，最终每个筛选都扫全表。
- 为了“兼容旧习惯”继续使用 `serial`、`timestamp without time zone`、`varchar(255)` 作为默认答案。
- 还没证明查询能被分区裁剪，就先引入复杂分区和维护成本。
