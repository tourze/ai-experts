---
name: redis-caching-patterns
description: "实现 Redis 缓存旁路、写穿、缓存雪崩与穿透防护，适用于数据库前缓存与热点保护"
---

# Redis Caching Patterns

## 适用场景

- 数据库前置缓存层读写策略选型（cache-aside、write-through、write-behind）。
- 高并发下防缓存击穿（thundering herd），需 singleflight 或锁刷新。
- 防缓存穿透（恶意请求不存在的 key），需空值缓存或布隆过滤器。
- TTL 抖动防雪崩，配合 [redis-key-design](../redis-key-design/SKILL.md)；锁刷新参考 [redis-distributed-lock](../redis-distributed-lock/SKILL.md)。

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

- 先删缓存再写 DB，高并发下旧数据被回填导致长期不一致。
- 缓存未命中时所有请求同时回源（thundering herd），不加互斥。
- 不存在的 key 不做缓存，恶意请求每次打穿到数据库。
- 固定 TTL 不加抖动，大量键同一秒过期引发雪崩。
