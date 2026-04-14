---
name: redis-best-practices
description: 设计和审查 Redis 键空间、缓存策略、并发控制与高可用方案，适用于缓存、计数器、锁、队列和流处理
---

# Redis Best Practices

## 适用场景

- 设计或审查缓存、会话、计数器、排行榜、分布式锁、队列、Streams 消费组。
- 排查缓存穿透、雪崩、热 key、键名混乱、误用数据结构、原子性不足等问题。
- Redis 作为数据库前缓存、异步削峰层或轻量状态机时，需要和业务库边界一起评估。
- 如果 Redis 只是数据库前缓存，联动 [mysql-best-practices](../mysql-best-practices/SKILL.md)、[postgresql-table-design](../postgresql-table-design/SKILL.md) 和 [sql-optimization](../sql-optimization/SKILL.md) 一起审查源库读写路径。

## 核心约束

- 先定义 canonical source of truth：Redis 默认是派生态，不要把关键业务真相只存一份在缓存里。
- 键名必须有清晰命名空间、对象标识和生命周期；缓存键默认带 TTL，并为大规模过期加入抖动。
- 分布式锁优先 `SET key value NX EX seconds` + 唯一 owner token；不要拆成 `SETNX` 再 `EXPIRE`。
- 批量扫描用 `SCAN`，不要在生产路径使用 `KEYS`；批量删除也要分批做。
- 数据结构按访问模式选型：字符串做简单值，Hash 做对象字段，ZSet 做排序，Streams 做可回溯消费。

## 代码模式

```redis
SET lock:order:123 worker-42 NX EX 30
```

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end

return 0
```

```python
import json
import random


def get_user(redis_client, db, user_id):
    key = f"cache:user:{user_id}"
    cached = redis_client.get(key)
    if cached is not None:
        return json.loads(cached)

    user = db.get_user(user_id)
    ttl = 3600 + random.randint(0, 300)
    redis_client.set(key, json.dumps(user), ex=ttl)
    return user
```

```redis
XGROUP CREATE events:orders order-workers $ MKSTREAM
XREADGROUP GROUP order-workers worker-1 COUNT 10 STREAMS events:orders >
```

## 检查清单

- 每一类 key 是否有统一前缀、过期策略和可观测的拥有者，而不是任由业务自由发挥。
- 缓存 miss、回源、回填、失效、热点保护是否组成完整闭环，而不是只写了 `get/set`。
- 锁、计数器、去重标记是否真正具备原子性，释放逻辑是否验证 owner token。
- 是否明确区分普通列表队列、可靠消息、Streams 消费组和 Pub/Sub 的适用边界。
- 内存上限、淘汰策略、持久化方式、主从或 Sentinel / Cluster 拓扑是否与业务 SLA 匹配。

## 反模式

- 把 Redis 当数据库用，却没有持久化、回源策略或补数据方案。
- 用 `SETNX` 和 `EXPIRE` 分两步抢锁，给并发窗口留出脏状态。
- 在生产脚本里直接跑 `KEYS cache:*`，把单线程实例拖成全局抖动。
- 一个对象拆成大量零散字符串 key，导致批量读取、失效和迁移都失控。
- 没有 TTL 抖动，结果大量热点键在同一秒一起过期，引发缓存雪崩。
