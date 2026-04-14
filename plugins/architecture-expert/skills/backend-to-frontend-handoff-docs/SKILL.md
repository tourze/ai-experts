---
name: backend-to-frontend-handoff-docs
description: "在后端接口完成后，为前端或前端代理生成交接文档时使用；重点覆盖业务背景、接口契约、校验规则、边界场景和联调建议。"
---

# backend-to-frontend-handoff-docs

## 适用场景
- 适合接口开发完成后的交接、联调准备和 API 文档补齐。
- 适合把散落在控制器、DTO、服务层和业务规则里的细节收敛成一份 handoff。
- 交叉引用：若还在做方案设计，先用 `system-design`；若接口尚未落地，先用 `feature-dev`。

## 核心约束
- 文档必须以真实实现为准，字段名、状态值、校验规则和错误码不得猜测。
- 简单 CRUD 可用简版模板，但复杂业务必须补齐业务背景、边界规则和测试场景。
- 输出应直接落到 `.claude/docs/ai/<feature-name>/api-handoff.md` 或用户指定路径。
- 不要把“后端如何实现”堆成源码讲解，前端只关心契约和集成行为。

## 代码模式
- 先收集接口列表、鉴权规则、请求/响应 DTO、枚举、错误码和边界条件。
- 正文推荐顺序：业务背景 → Endpoints → DTO → 枚举常量 → 校验规则 → 边界场景 → 集成建议。
- 如需附示例，请直接给 JSON 形状和字段说明。

```markdown
# API Handoff: Password Reset

## Business Context
## Endpoints
## Data Models / DTOs
## Validation Rules
## Business Logic & Edge Cases
```

## 检查清单
- 是否覆盖所有前端会直接消费的接口和 DTO。
- 是否明确鉴权、分页、排序、缓存、轮询或实时更新规则。
- 是否写清错误码、字段约束和镜像到前端的校验逻辑。
- 是否补充了联调测试场景和已知限制。

## 反模式
- 只贴 Swagger 地址，不解释业务语义。
- 字段、枚举或错误码与代码不一致。
- 只写 happy path，不写失败路径和边界行为。
- 把待办或待定项伪装成已实现功能。
