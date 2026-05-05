# Row-Level Security 代码模式

## 启用 RLS + 租户隔离策略

```sql
ALTER TABLE project ENABLE ROW LEVEL SECURITY;
ALTER TABLE project FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON project
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::BIGINT)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::BIGINT);
```

## 角色分级策略 — admin 全部可见、member 只见自己

```sql
CREATE ROLE app_admin;
CREATE ROLE app_member;

CREATE POLICY admin_full_access ON task
    FOR ALL
    TO app_admin
    USING (tenant_id = current_setting('app.tenant_id')::BIGINT)
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::BIGINT);

CREATE POLICY member_own_rows ON task
    FOR ALL
    TO app_member
    USING (
        tenant_id = current_setting('app.tenant_id')::BIGINT
        AND created_by = current_setting('app.user_id')::BIGINT
    )
    WITH CHECK (
        tenant_id = current_setting('app.tenant_id')::BIGINT
        AND created_by = current_setting('app.user_id')::BIGINT
    );
```

## 应用连接初始化 — 设置会话变量

```sql
-- 从连接池获取连接后、执行业务 SQL 前设置
SET LOCAL app.tenant_id = '42';
SET LOCAL app.user_id = '7';
SET LOCAL ROLE app_member;

-- 业务查询自动受 RLS 策略约束
SELECT id, title, status FROM task WHERE status = 'open';
-- 事务结束后 SET LOCAL 自动失效
```

## 测试 RLS 策略

```sql
INSERT INTO task (tenant_id, title, created_by, status)
VALUES (1, '租户1的任务', 10, 'open'),
       (2, '租户2的任务', 20, 'open');

SET LOCAL ROLE app_member;
SET LOCAL app.tenant_id = '1';
SET LOCAL app.user_id = '10';

-- 验证：只能看到 tenant_id=1 且 created_by=10 的行
SELECT * FROM task;

-- 验证：插入其他租户数据应被拒绝
INSERT INTO task (tenant_id, title, created_by, status)
VALUES (2, '非法插入', 10, 'open');
-- 报 new row violates row-level security policy

RESET ROLE;
```
