---
name: pgsql-row-level-security
description: "当用户要实现或审查 PostgreSQL 行级安全策略、多租户隔离或角色权限管理时使用。适用于共享表的数据边界控制。"
---

# PostgreSQL Row-Level Security

## 适用场景

- 多租户 SaaS 共享表存储，需要数据库层面强制租户隔离
- 按角色（admin / manager / member）限制行级可见范围
- 连接池共享连接，每次请求通过 `SET LOCAL` 设置会话变量驱动 RLS
- 需要用 `SET ROLE` 测试策略的正确性
- 租户列设计参见 [pgsql-schema-design](../pgsql-schema-design/SKILL.md)；tenant_id 前缀索引参见 [pgsql-index-strategy](../pgsql-index-strategy/SKILL.md)

## 核心约束

- 启用 RLS 后表 owner 默认绕过策略 — 必须加 `FORCE ROW LEVEL SECURITY`
- `USING` 控制读（SELECT/UPDATE/DELETE），`WITH CHECK` 控制写（INSERT/UPDATE），两者都要显式声明
- `current_setting('app.tenant_id')` 必须在每个事务开始时设置，忘记设置会导致数据泄漏或全拒绝
- 策略谓词保持简单列比较，避免子查询或复杂函数（每行执行一次影响性能）
- RLS 是防御纵深的一层，应用层仍需业务逻辑级权限校验

## 代码模式

详细示例参见 [references/code-patterns.md](./references/code-patterns.md)。核心模板：

```sql
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON project
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::BIGINT)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::BIGINT);
```

## 检查清单

- 是否同时设置了 `FORCE ROW LEVEL SECURITY`
- 每个策略是否同时声明了 `USING` 和 `WITH CHECK`
- 应用是否在获取连接后正确执行 `SET LOCAL app.tenant_id`
- 策略谓词是否只含简单列比较和 `current_setting()` 调用
- 是否有自动化测试覆盖正向（看到自己的数据）和反向（不能跨租户读写）

## 反模式

### FAIL: 启用 RLS 但 owner 绕过

```sql
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON project
    USING (tenant_id = current_setting('app.tenant_id')::BIGINT);
-- 应用用 owner 角色连接 → RLS 完全不生效，所有租户数据可见
```

### PASS: 同时 FORCE

```sql
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;  -- ← 关键
-- owner 也必须遵守策略
```

### FAIL: 只 USING 不 WITH CHECK

```sql
CREATE POLICY tenant_read ON project FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::BIGINT);

-- tenant A 用户：
INSERT INTO project (tenant_id, name) VALUES (999, 'evil');
-- 写入成功！USING 只校验读，没校验写
```

### PASS: USING + WITH CHECK 双向

```sql
CREATE POLICY tenant_iso ON project FOR ALL
    USING      (tenant_id = current_setting('app.tenant_id')::BIGINT)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::BIGINT);
-- 读和写都被锁定到当前租户
```

### FAIL: 忘记 SET LOCAL

```python
def get_projects(conn, tenant_id):
    # 忘了 SET LOCAL
    return conn.execute("SELECT * FROM project")
# current_setting('app.tenant_id') 残留上一个请求的值 → 跨租户泄漏
```

### PASS: 中间件强制设置

```python
@app.middleware
def set_tenant(request, call_next):
    with conn.transaction():
        conn.execute("SET LOCAL app.tenant_id = %s", [request.tenant_id])
        return call_next(request)
# 每事务开始强制设置，事务结束自动重置
```
