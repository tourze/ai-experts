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
