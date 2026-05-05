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

## 反模式

### FAIL: 只贴 Swagger

```md
"接口文档：https://api.example.com/swagger"
→ 前端打开：100 个 endpoint，没有业务上下文
→ "这个 status_code = 4231 是什么意思？要怎么处理？"
```

### PASS: Endpoint + 业务语义

```md
## POST /api/orders
业务含义：用户提交订单（已下单未支付）
鉴权：Bearer token (user 角色)
请求：{ items: [...], shipping: {...} }
响应：
- 201 + { order_id, payment_url } → 跳支付页
- 400 + { code: "STOCK_INSUFFICIENT", item_id } → 提示库存不足
- 409 + { code: "DUPLICATE_ORDER" } → 提示已下过相同订单
```

### FAIL: 只 happy path

```md
GET /users/{id} → 200 { user object }
→ 前端 production：404 / 403 / 500 全部白屏
```

### PASS: 全状态码 + 边界

```md
GET /users/{id}
- 200: { id, email, ... }
- 401: 未登录 → 跳登录页
- 403: 越权访问 → 显示"无权限"
- 404: 用户不存在或已删除 → 显示"用户不存在"
- 5xx: 显示通用错误 + 重试按钮

边界：
- email 可为空（新注册用户未验证邮箱）
- 软删除用户：404，不返回 status:deleted
```
