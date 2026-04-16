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

- 启用 RLS 不设 `FORCE` — owner 身份连接时策略完全失效
- 只写 `USING` 不写 `WITH CHECK` — INSERT/UPDATE 新行不受约束
- 忘记 `SET LOCAL` 会话变量 — `current_setting()` 返回空值或上一请求残留值
- 策略谓词含子查询 — 每行执行一次，大表性能灾难
- 仅依赖 RLS 不做应用层校验 — 防御纵深原则要求多层保护
