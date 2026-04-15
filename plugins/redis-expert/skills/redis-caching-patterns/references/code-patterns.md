# Redis Caching Patterns — Code Patterns

## cache-aside 读写模式（Python）

```python
import json
import random
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

BASE_TTL = 3600
JITTER = 300


def get_user(user_id: int) -> dict:
    """cache-aside 读路径：缓存命中直接返回，未命中则查库并回填。"""
    cache_key = f"user-svc:profile:{user_id}"
    cached = client.get(cache_key)
    if cached is not None:
        return json.loads(cached)
    user = {"id": user_id, "name": "alice", "email": "alice@example.com"}
    ttl = BASE_TTL + random.randint(-JITTER, JITTER)
    client.set(cache_key, json.dumps(user), ex=ttl)
    return user


def update_user(user_id: int, data: dict) -> None:
    """cache-aside 写路径：先写数据库，再删缓存。"""
    _ = data
    cache_key = f"user-svc:profile:{user_id}"
    client.delete(cache_key)
```

## singleflight 防击穿（互斥刷新）

```python
import json
import time
import uuid
import random
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

LOCK_TTL = 10
CACHE_TTL = 3600
JITTER = 300


def get_product_with_refresh_lock(product_id: int) -> dict:
    """防缓存击穿：用 SET NX EX 实现互斥刷新。"""
    cache_key = f"catalog:product:{product_id}"
    lock_key = f"lock:refresh:product:{product_id}"
    owner = str(uuid.uuid4())

    cached = client.get(cache_key)
    if cached is not None:
        return json.loads(cached)

    acquired = client.set(lock_key, owner, nx=True, ex=LOCK_TTL)
    if not acquired:
        time.sleep(0.05)
        cached = client.get(cache_key)
        if cached is not None:
            return json.loads(cached)
        return {"id": product_id, "status": "loading"}

    try:
        product = {"id": product_id, "name": "widget", "price": 29.9}
        ttl = CACHE_TTL + random.randint(-JITTER, JITTER)
        client.set(cache_key, json.dumps(product), ex=ttl)
        return product
    finally:
        release_script = """
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0
"""
        client.eval(release_script, 1, lock_key, owner)
```

## 空值缓存防穿透

```python
import json
import random
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

NULL_SENTINEL = "__NULL__"
NULL_TTL = 60
CACHE_TTL = 3600
JITTER = 300


def get_item_with_null_cache(item_id: int) -> dict | None:
    """缓存穿透防御：对不存在的 key 缓存空值标记。"""
    cache_key = f"inventory:item:{item_id}"
    cached = client.get(cache_key)

    if cached == NULL_SENTINEL:
        return None
    if cached is not None:
        return json.loads(cached)

    item = None  # 模拟数据库查询：不存在

    if item is None:
        client.set(cache_key, NULL_SENTINEL, ex=NULL_TTL)
        return None

    ttl = CACHE_TTL + random.randint(-JITTER, JITTER)
    client.set(cache_key, json.dumps(item), ex=ttl)
    return item
```

## Lua 原子化 check-and-refresh

```lua
-- KEYS[1] = cache_key, ARGV[1] = new_value, ARGV[2] = ttl_seconds
local current = redis.call("GET", KEYS[1])
if current == false then
    redis.call("SET", KEYS[1], ARGV[1], "EX", tonumber(ARGV[2]))
    return 1
end
return 0
```
