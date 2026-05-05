# api-trace-reader

## 适用场景
- 当用户问“这个接口都干了什么”“什么情况会触发”“帮我串一下调用链”时使用。
- 适合定位数据库写入、缓存变更、消息投递、定时任务和事件监听的真实来源。
- 交叉引用：若要做系统级问题盘点，配合 `architecture-reviewer`（Exhaustive 模式）；若要审方案而不是追链路，改用 `plan-review`。

## 核心约束
- 只允许只读操作：`Read` / `Grep` / `Glob` / 只读 Bash。
- 禁止 `Edit` / `Write` / 迁移 / 清缓存 / 推送 / 任何会改状态的命令。
- 每条结论必须带 `file:line`、日志片段或 grep 证据，禁止“我猜”。
- 输出标题固定为 `入口`、`调用链`、`数据读写`、`异步副作用`、`风险点`、`验证方式`。

## 代码模式
- 先读 [入口类型说明](references/entry-types.md) 判断入口类型。
- 调用链格式遵循 [输出示例](references/output-example.md)。
- 风险分级使用 [风险分级表](references/risk-rubric.md)。


## 检查清单
- 是否确认了入口是 HTTP、CLI、消费者、定时任务、事件还是 webhook。
- 是否列出了每一级调用者、被调者和关键参数流向。
- 是否单列了 READ / WRITE / CACHE / MQ / EXTERNAL / FS 副作用。
- 是否补齐异步链路、重试逻辑、监听器和延迟任务。

## 反模式

### FAIL: 边追边改

```
追到 OrderService.create → 顺手"优化"了一下命名
→ 调用方全部失败 → 用户期待只读分析却被破坏现状
```

### PASS: 严格只读

```
全程 Read/Grep/Glob，不调用 Edit/Write
要修改时，先输出完整链路报告 → 用户决策 → 才进入实施
```

### FAIL: 主干 only

```
"POST /orders 的链路：
Controller → Service → Repository → DB"
→ 漏掉：MQ 发"order.created"事件 → 5 个监听器 → 库存扣减、积分、邮件、推送、审计
```

### PASS: 全副作用

```
入口：POST /orders
调用链：Controller → Service → Repo
副作用：
- WRITE: orders, order_items
- MQ: order.created → [InventoryListener (-stock), AuditListener]
- CACHE: del user:{id}:cart
- EXTERNAL: stripe.charge()
```

### FAIL: 没证据下结论

```
"OrderService 应该有去重逻辑"
→ 用户去看 → 没有 → 信任崩
```

### PASS: file:line 锚定

```
"OrderService.create 当前无去重 (src/order/service.go:42-78)
风险：用户快速点击会创建重复订单
建议：加 idempotency_key 参数"
```
