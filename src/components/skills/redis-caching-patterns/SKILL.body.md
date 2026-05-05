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
