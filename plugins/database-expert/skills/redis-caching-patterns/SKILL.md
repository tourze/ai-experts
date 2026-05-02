---
name: redis-caching-patterns
description: "当用户要实现或排查 Redis 缓存旁路、写穿、缓存雪崩或穿透防护时使用。适用于数据库前缓存与热点保护。"
---

# Redis Caching Patterns

## 适用场景

- 数据库前置缓存层读写策略选型（cache-aside、write-through、write-behind）。
- 高并发下防缓存击穿（thundering herd），需 singleflight 或锁刷新。
- 防缓存穿透（恶意请求不存在的 key），需空值缓存或布隆过滤器。
- TTL 抖动防雪崩，配合 [redis-data-modeling](../redis-data-modeling/SKILL.md) 的键设计与锁模式。

## 核心约束

- cache-aside 读路径：check cache → miss → query DB → set cache；写路径：先写 DB 再删缓存。
- 互斥刷新用 `SET key value NX EX seconds`，严禁无保护地并发回源。
- 穿透防御至少一种：空值缓存（短 TTL）或布隆过滤器。
- TTL 必须添加随机抖动，禁止所有键使用相同固定 TTL。
- 删缓存失败需有补偿（重试队列或 binlog 监听），不能静默忽略。

## 代码模式

```python
import json
import random
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

BASE_TTL = 3600
JITTER = 300


def get_user(user_id: int) -> dict:
    """cache-aside 读路径。"""
    cache_key = f"user-svc:profile:{user_id}"
    cached = client.get(cache_key)
    if cached is not None:
        return json.loads(cached)
    user = {"id": user_id, "name": "alice"}
    ttl = BASE_TTL + random.randint(-JITTER, JITTER)
    client.set(cache_key, json.dumps(user), ex=ttl)
    return user
```

## 检查清单

- 读路径是否严格 check → miss → query → set，写路径是否先写 DB 再删缓存。
- 高并发键是否有互斥刷新保护，防止击穿。
- 不存在的 key 是否有穿透防御。
- TTL 是否有随机抖动。
- 删缓存失败是否有补偿机制。

## 反模式

### FAIL: 先删缓存再写 DB

```python
client.delete(key)            # 1. 删缓存
db.update(...)                # 2. 写 DB
# 时间窗内：另一请求 miss → 读旧 DB → 写回缓存 → 长期不一致
```

### PASS: 先写 DB 再删缓存

```python
db.update(...)                # 1. 写 DB
client.delete(key)            # 2. 删缓存
# 后续 miss 读到新值
# 删失败 → 投递到补偿队列重试，不静默忽略
```

### FAIL: 击穿不加互斥

```python
def get(key):
    val = client.get(key)
    if val is None:
        val = db.query(...)   # 1000 个并发请求同时打 DB
        client.set(key, val, ex=3600)
    return val
```

### PASS: SET NX 互斥刷新

```python
def get(key):
    val = client.get(key)
    if val is not None: return val
    lock_key = f"lock:{key}"
    if client.set(lock_key, "1", nx=True, ex=10):
        try:
            val = db.query(...)
            client.set(key, val, ex=3600 + random.randint(-300, 300))
        finally:
            client.delete(lock_key)
    else:
        time.sleep(0.05)       # 短退避后再读缓存
        return client.get(key)
    return val
```

### FAIL: 不存在的 key 不缓存

```python
val = client.get(f"user:{user_id}")
if val is None:
    val = db.query("SELECT * FROM users WHERE id=?", user_id)
    if val: client.set(...)
    # 不存在则不缓存 → 攻击者刷不存在 ID → 每次打 DB
```

### PASS: 空值缓存（短 TTL）

```python
if val is None:
    user = db.query(...)
    if user:
        client.set(key, json.dumps(user), ex=3600 + jitter)
    else:
        client.set(key, "__NULL__", ex=60)  # 短 TTL 防长期占位
```
