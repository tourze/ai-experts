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
