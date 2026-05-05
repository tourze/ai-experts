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
