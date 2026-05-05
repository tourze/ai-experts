# 接口契约模板

## REST API 契约模板

```yaml
# openapi 片段
paths:
  /v1/orders:
    post:
      summary: 创建订单
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [customer_id, items]
              properties:
                customer_id: { type: string, format: uuid }
                items:
                  type: array
                  minItems: 1
                  items:
                    type: object
                    required: [sku, quantity]
                    properties:
                      sku: { type: string }
                      quantity: { type: integer, minimum: 1 }
      responses:
        '201':
          description: 订单已创建
        '400':
          description: 参数校验失败
        '409':
          description: 库存不足冲突
        '429':
          description: 频率限制
```

## gRPC 契约模板

```protobuf
syntax = "proto3";
package orders.v1;

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
}

message CreateOrderRequest {
  string customer_id = 1;
  repeated OrderItem items = 2;
}

message CreateOrderResponse {
  string order_id = 1;
  OrderStatus status = 2;
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;
  ORDER_STATUS_CREATED = 1;
  ORDER_STATUS_CONFIRMED = 2;
}
```

## Breaking Change 记录模板

```markdown
### v1 → v2: 订单金额字段
- 变更类型：字段类型 string → Money 对象
- 影响：所有解析 amount 为字符串的客户端会失败
- 过渡期：v1 仍然返回 string amount 和新的 Money amount_v2，6 个月后移除 string 版本
- 迁移状态：2026-01 发布 v2，当前(2026-05) v1 调用量 < 5%，计划 2026-07 移除
```

## 反模式

### FAIL: 无过渡期的直接变更

```
// v1: { "total": 100 }
// v2: { "total": { "amount": 100, "currency": "CNY" } }
// 直接替换，所有调用方当场爆炸
```

### PASS: 双字段过渡

```
// v2: { "total": 100, "total_v2": { "amount": 100, "currency": "CNY" } }
// 新旧并存，给调用方迁移窗口
```
