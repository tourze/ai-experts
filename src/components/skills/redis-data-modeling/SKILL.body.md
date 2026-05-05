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

## 反模式

- `SETNX` + `EXPIRE` 两步获取锁（非原子，可能死锁）。
- `KEYS *` 在生产环境使用。
- 所有键使用相同固定 TTL 导致缓存雪崩。
- 用 List 做简易消息队列却不处理消费者崩溃后的消息丢失。
- 释放锁时不校验 owner，误删其他客户端的锁。
