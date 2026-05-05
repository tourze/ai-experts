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
