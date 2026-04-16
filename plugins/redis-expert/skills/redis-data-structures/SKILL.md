---
name: redis-data-structures
description: "当用户要为 Redis 选择合适的数据结构（String、Hash、List、Set、ZSet、Stream、HyperLogLog）时使用。"
---

# Redis Data Structures

## 适用场景

- 新功能数据建模，需在 String / Hash / List / Set / ZSet / Stream 间选型。
- 排行榜、计数器、消息队列、UV 统计等典型场景的结构选择。
- 评估不同结构的内存效率和编码阈值（ziplist / listpack）。
- Stream 消费者组替代 List 简易队列，键名配合 [redis-key-design](../redis-key-design/SKILL.md)。
- 完整代码示例见 [references/code-patterns.md](references/code-patterns.md)。

## 核心约束

- String 用于简单值和原子计数器（INCR），单 value 建议不超过 10 KB。
- Hash 用于部分字段读写，字段数 ≤128 且值 ≤64B 时用 ziplist/listpack 更省内存。
- ZSet score 是 double，精度有限；高精度排序用 `score:timestamp` 组合。
- Stream 消费者组必须显式 XACK，未确认消息留在 PEL 导致内存增长。
- 选结构前必须明确访问模式（点查 / 范围 / 排序 / 聚合），不仅看数据形状。

## 代码模式

```python
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def add_score(user_id: str, score: float) -> None:
    client.zadd("game:leaderboard:weekly", {user_id: score})


def get_top_n(n: int = 10) -> list[tuple[str, float]]:
    return client.zrevrange("game:leaderboard:weekly", 0, n - 1, withscores=True)
```

## 检查清单

- 是否根据访问模式选择结构，而非仅看数据形状。
- ZSet score 精度是否足够，时间戳是否用毫秒级。
- Stream 消费者组是否 XACK，PEL 是否有监控和清理。
- Hash 字段数和值是否在 ziplist/listpack 阈值内。
- 集合类元素数是否有上限控制（LTRIM / ZREMRANGEBYRANK）。

## 反模式

- 用 String 存整个 JSON，每次只需一个字段也要全量反序列化。
- 用 List 做消息队列却不处理消费者崩溃后的消息丢失，应用 Stream。
- 用 Set 做排行榜，Set 不支持排序，应用 ZSet。
- LPUSH + LRANGE 不加 LTRIM，List 无限增长耗尽内存。
