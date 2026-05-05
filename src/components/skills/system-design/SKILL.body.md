## 代码模式
- 输出顺序建议：需求 → 高层组件 → 数据流 → 数据模型/API → 可靠性与扩展 → trade-off。
- 如果问题偏数据一致性或存储选型，单独引入 `ddia-systems` 约束答案。
- 如果问题偏落地执行，再把设计切给 `task-decomposer`。

## 反模式

### FAIL: 不问需求直接微服务

```
“订单系统方案：API Gateway → Order → Payment → Inventory，
每服务独立 DB，Kafka 事件驱动，k8s + istio”
```

→ 没问 QPS、团队规模、一致性。10 人 100 QPS 不需要这套。

### PASS: 先量化再给方案

```
澄清：100 QPS，100 万订单/月，3 人团队
→ 单体 Rails + Postgres 主从
→ 支付走事务（强一致），通知走 outbox + worker（最终一致）
→ Trade-off：单点故障，QPS > 500 再拆
```

### FAIL: 只给图不说代价

```
[缓存 + MQ + 读写分离] → “高可用可扩展”
```

### PASS: 每个决策配代价

```
读写分离：
- 收益：读 QPS ×5-10
- 代价：从库 100-500ms 延迟，刚下单看列表可能看不到
- 规避：写后强制打主库（session 粘连）
```
