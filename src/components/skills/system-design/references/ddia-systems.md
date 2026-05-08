
# ddia-systems

## 适用场景
- 适合数据库选型、复制滞后、分区策略、事务边界和一致性模型讨论。
- 适合解释为什么某种数据架构在当前约束下更稳妥。
- 交叉引用：宏观系统边界用 `system-design`；要做风险评审时配合 `architecture-reviewer`。

## 核心约束
- 必须先明确读写模式、数据规模、延迟目标和一致性要求。
- 不要把某种存储模型当银弹，所有结论都要写出 trade-off。
- 涉及复制、分区和事务时，要说明故障场景下的行为。
- 尽量基于访问模式选模型，而不是基于团队习惯拍脑袋。

## 代码模式
- 按需读取 [存储引擎](./storage-engines.md)、[复制](./replication.md)、[分区](./partitioning.md)、[事务](./transactions.md)、[容错](./fault-tolerance.md)、[批流处理](./batch-stream.md)。
- 决策顺序推荐：数据模型 → 存储引擎 → 复制/分区 → 一致性/事务 → 故障恢复。
- 输出中必须把 CAP、延迟、成本、运维复杂度写清楚。


## 检查清单
- 是否说明了主查询模式、写放大和热点分布。
- 是否解释复制、故障切换和一致性窗口。
- 是否明确事务边界、幂等策略和恢复流程。
- 是否为批流一体或双写场景列出风险。

## 反模式

### FAIL: 只给名字

```
"用 Postgres + Redis"
→ 客户："为什么不是 MySQL? 缓存策略是什么? 一致性怎么保证?"
→ 答不上
```

### PASS: 访问模式驱动选型

```md
## 选 Postgres
- 主查询：复杂 join + 事务（订单 + 库存 + 支付）
- 写量：100 QPS（中等）
- 一致性要求：strong (RC + FOR UPDATE)
- 数据量：5 年内 < 500GB
对比：MongoDB 缺事务 / Cassandra 无 join

## 缓存职责（不是"数据库 v2"）
- Redis 仅缓存 read-heavy & 容忍 stale 的数据
- 不缓存订单状态（一致性要求）
- TTL 5 min + 主动 invalidate on write
```

### FAIL: 忽略复制延迟

```sql
-- 写主库
INSERT INTO orders ...
-- 立即从只读副本读
SELECT * FROM orders WHERE id = ?  -- 副本还没 replicate → 404
→ 用户："我刚下的订单去哪了？"
```

### PASS: 显式应对 lag

```
方案 A: 写后立即读走主库（read-after-write consistency）
方案 B: 客户端记录 last_write_lsn，副本 catch up 后才读
方案 C: 接受最终一致 + UI 显示 "正在同步"
→ 写文档，让前端知道每个 endpoint 的一致性保证
```
