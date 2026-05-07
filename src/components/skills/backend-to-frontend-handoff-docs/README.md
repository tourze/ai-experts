# backend-to-frontend-handoff-docs

用于把后端已实现的接口整理成前端可直接消费的 handoff 文档。

## 输出位置

- 默认输出到 `docs/ai/<feature-name>/api-handoff.md`。
- 如果重复生成同一功能，应在文件名或标题中体现版本迭代。

## 最小结构

```markdown
# API Handoff: <Feature Name>
## Business Context
## Endpoints
## Data Models / DTOs
## Validation Rules
## Business Logic & Edge Cases
## Integration Notes
## Test Scenarios
```

## 校验要求

- 字段名、状态值、错误码必须与真实实现一致。
- 简单 CRUD 可以简写，复杂业务必须补齐边界场景。
- 文档服务对象是前端集成，不要写成后端源码讲解。
