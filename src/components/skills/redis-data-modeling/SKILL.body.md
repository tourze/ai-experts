## 核心约束

### 数据结构选型

- String 用于简单值和原子计数器（INCR），单 value 建议不超过 10 KB。
- Hash 用于部分字段读写，字段数 ≤128 且值 ≤64B 时用 listpack 更省内存。
- ZSet score 是 double，精度有限；高精度排序用 score:timestamp 组合。
- Stream 消费者组必须显式 XACK，未确认消息留在 PEL 导致内存增长。
- 选结构前必须明确访问模式（点查 / 范围 / 排序 / 聚合），不仅看数据形状。

### 键设计

- 键名格式 `{service}:{object_type}:{id}`，冒号分隔，全小写，禁止空格和特殊字符。
- 生产环境严禁 `KEYS *`，必须用 `SCAN` + `MATCH` + `COUNT`。
- 所有临时键必须设置 TTL 且带随机抖动，永久键需文档登记。
- 单 key value 不超过 10 KB（String）或 5000 元素（集合类），超出需拆分。
- 用 `MEMORY USAGE` 和 `OBJECT ENCODING` 定期审计键内存。

### 分布式锁

- 获取锁必须用 `SET key value NX EX seconds` 单条原子命令，严禁 `SETNX` + `EXPIRE`。
- value 必须是唯一 owner token（UUID），释放时 Lua 校验 owner 后再 DEL。
- 锁超时必须大于业务最大执行时间，或用 watchdog 自动续期。
- Redlock 需 5 个独立实例，获取多数派（N/2+1）且扣除获取耗时。

详细模式见：[references/redis-data-structures.md](references/redis-data-structures.md)、[references/redis-key-design.md](references/redis-key-design.md)、[references/redis-distributed-lock.md](references/redis-distributed-lock.md)。

## 代码模式

```python
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

# 键命名与 TTL
client.set("user-svc:profile:10042", '{"name":"alice"}', ex=3600)

# ZSet 排行榜
def add_score(user_id: str, score: float) -> None:
    client.zadd("game:leaderboard:weekly", {user_id: score})

def get_top_n(n: int = 10) -> list[tuple[str, float]]:
    return client.zrevrange("game:leaderboard:weekly", 0, n - 1, withscores=True)
```

```redis
-- 原子获取锁
SET lock:order:pay:50001 "550e8400-uuid" NX EX 30

-- Lua 校验 owner 后安全释放
EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0" 1 lock:order:pay:50001 "550e8400-uuid"
```

## 检查清单

### 数据结构

- 所选结构是否匹配访问模式（点查用 Hash、排序用 ZSet、流式用 Stream）。
- 大 key 是否已拆分，单值是否在 10 KB / 5000 元素阈值内。
- Stream 消费者组是否有 XACK 和 PEL 监控。

### 键设计

- 所有键是否遵循三段式命名，无裸键或无前缀键。
- TTL 是否带随机抖动，是否存在大量相同固定 TTL 的键。
- 是否有使用 `KEYS` 的代码路径（必须替换为 `SCAN`）。

### 分布式锁

- 是否用 `SET key value NX EX` 单条命令，而非两步操作。
- 释放锁是否通过 Lua 校验 owner，防止误删他人锁。
- 锁超时是否大于业务执行时间，长任务是否有 watchdog。
- 多实例场景是否评估了 Redlock 和时钟偏移风险。

## 反模式

- `SETNX` + `EXPIRE` 两步获取锁（非原子，可能死锁）。
- `KEYS *` 在生产环境使用。
- 所有键使用相同固定 TTL 导致缓存雪崩。
- 用 List 做简易消息队列却不处理消费者崩溃后的消息丢失。
- 释放锁时不校验 owner，误删其他客户端的锁。
