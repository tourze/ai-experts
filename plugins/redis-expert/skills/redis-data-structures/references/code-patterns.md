# Redis Data Structures — Code Patterns

## ZSet 排行榜

```python
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

LEADERBOARD_KEY = "game:leaderboard:weekly"


def add_score(user_id: str, score: float) -> None:
    """添加或更新用户分数。"""
    client.zadd(LEADERBOARD_KEY, {user_id: score})


def get_top_n(n: int = 10) -> list[tuple[str, float]]:
    """获取分数最高的 N 个用户（降序）。"""
    return client.zrevrange(LEADERBOARD_KEY, 0, n - 1, withscores=True)


def get_user_rank(user_id: str) -> int | None:
    """获取用户排名（0-based，降序）。"""
    rank = client.zrevrank(LEADERBOARD_KEY, user_id)
    return rank


add_score("player:1001", 8500)
add_score("player:1002", 9200)
add_score("player:1003", 7800)

top3 = get_top_n(3)
for member, score in top3:
    print(f"{member}: {score}")
```

## Stream 消费者组消息队列

```python
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

STREAM_KEY = "events:order"
GROUP_NAME = "order-processor"
CONSUMER_NAME = "worker-1"


def ensure_group(stream: str, group: str) -> None:
    """创建消费者组，已存在则跳过。"""
    try:
        client.xgroup_create(stream, group, id="0", mkstream=True)
    except redis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise


def produce_event(stream: str, data: dict) -> str:
    """发布事件到 Stream。"""
    message_id = client.xadd(stream, data)
    return message_id


def consume_events(stream: str, group: str, consumer: str, count: int = 10) -> None:
    """消费并确认 Stream 消息。"""
    messages = client.xreadgroup(group, consumer, {stream: ">"}, count=count, block=5000)
    if not messages:
        return
    for stream_name, entries in messages:
        for message_id, fields in entries:
            print(f"Processing {message_id}: {fields}")
            client.xack(stream_name, group, message_id)


ensure_group(STREAM_KEY, GROUP_NAME)
produce_event(STREAM_KEY, {"order_id": "50001", "action": "created"})
consume_events(STREAM_KEY, GROUP_NAME, CONSUMER_NAME)
```

## ZSet 滑动窗口限流器

```python
import time
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def is_rate_limited(
    key: str, max_requests: int, window_seconds: int
) -> bool:
    """基于 ZSet 的滑动窗口限流。返回 True 表示被限流。"""
    now = time.time()
    window_start = now - window_seconds
    pipe = client.pipeline(transaction=True)
    pipe.zremrangebyscore(key, "-inf", window_start)
    pipe.zcard(key)
    pipe.zadd(key, {f"{now}": now})
    pipe.expire(key, window_seconds + 1)
    results = pipe.execute()

    current_count = results[1]
    return current_count >= max_requests


rate_key = "ratelimit:api:user:10042"
if is_rate_limited(rate_key, max_requests=100, window_seconds=60):
    print("Rate limited!")
else:
    print("Request allowed")
```

## HyperLogLog UV 统计

```redis
PFADD stats:uv:page:home:2024-01-15 "visitor-001" "visitor-002" "visitor-003"
PFADD stats:uv:page:home:2024-01-15 "visitor-001" "visitor-004"
PFCOUNT stats:uv:page:home:2024-01-15
PFMERGE stats:uv:page:home:week stats:uv:page:home:2024-01-15 stats:uv:page:home:2024-01-16
```
