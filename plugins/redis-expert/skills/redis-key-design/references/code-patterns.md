# Redis Key Design — Code Patterns

## 键命名规范示例

```redis
# 三段式：{service}:{object_type}:{id}
SET user-svc:profile:10042 '{"name":"alice"}' EX 3600

# 带版本号的缓存键
SET catalog:product:v2:8899 '{"price":29.9}' EX 7200

# 会话键
SET auth:session:abc-def-123 '{"uid":10042}' EX 1800

# 分布式锁键
SET lock:order:pay:50001 "owner-uuid" NX EX 30

# 计数器键
SET stats:api:hits:2024-01-15 0 EX 172800
INCR stats:api:hits:2024-01-15
```

## TTL 抖动防雪崩（Python）

```python
import random
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

BASE_TTL = 3600
JITTER_RANGE = 300


def set_with_jitter(key: str, value: str, base_ttl: int = BASE_TTL) -> None:
    """设置缓存并添加 TTL 随机抖动，防止大量键同时过期。"""
    jitter = random.randint(-JITTER_RANGE, JITTER_RANGE)
    ttl = max(base_ttl + jitter, 60)
    client.set(key, value, ex=ttl)


set_with_jitter("user-svc:profile:10042", '{"name":"alice"}')
```

## 使用 SCAN 安全遍历键空间

```python
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def scan_keys(pattern: str, batch_size: int = 200) -> list[str]:
    """安全遍历键空间，禁止使用 KEYS 命令。"""
    result: list[str] = []
    cursor = 0
    while True:
        cursor, keys = client.scan(cursor=cursor, match=pattern, count=batch_size)
        result.extend(keys)
        if cursor == 0:
            break
    return result


def inspect_key_memory(key: str) -> dict[str, object]:
    """检查单个键的编码方式和内存占用。"""
    encoding = client.object("encoding", key)
    memory_bytes = client.memory_usage(key) or 0
    ttl = client.ttl(key)
    return {"key": key, "encoding": encoding, "memory_bytes": memory_bytes, "ttl": ttl}


expired_candidates = scan_keys("user-svc:profile:*")
for k in expired_candidates[:10]:
    info = inspect_key_memory(k)
    print(f"{info['key']}: encoding={info['encoding']}, "
          f"memory={info['memory_bytes']}B, ttl={info['ttl']}s")
```

## MEMORY USAGE 和 OBJECT ENCODING 审计

```redis
MEMORY USAGE user-svc:profile:10042
OBJECT ENCODING user-svc:profile:10042
OBJECT IDLETIME user-svc:profile:10042
```
