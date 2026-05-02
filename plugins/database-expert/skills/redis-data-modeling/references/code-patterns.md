# Redis Distributed Lock — Code Patterns

## 获取与安全释放（原子操作）

```redis
# 获取锁：NX 保证互斥，EX 设置超时防死锁
SET lock:order:pay:50001 "550e8400-e29b-41d4-a716-446655440000" NX EX 30

# 安全释放：Lua 校验 owner
EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0" 1 lock:order:pay:50001 "550e8400-e29b-41d4-a716-446655440000"
```

## Python 上下文管理器

```python
import time
import uuid
import redis


class RedisLock:
    """Redis 分布式锁，支持自动释放和可选续期。"""

    RELEASE_SCRIPT = """
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0
"""

    RENEW_SCRIPT = """
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0
"""

    def __init__(
        self,
        client: redis.Redis,
        name: str,
        timeout: int = 30,
        retry_interval: float = 0.1,
        retry_times: int = 3,
    ) -> None:
        self.client = client
        self.name = name
        self.timeout = timeout
        self.retry_interval = retry_interval
        self.retry_times = retry_times
        self.owner = str(uuid.uuid4())
        self._acquired = False

    def acquire(self) -> bool:
        for _ in range(self.retry_times):
            if self.client.set(self.name, self.owner, nx=True, ex=self.timeout):
                self._acquired = True
                return True
            time.sleep(self.retry_interval)
        return False

    def release(self) -> bool:
        if not self._acquired:
            return False
        result = self.client.eval(self.RELEASE_SCRIPT, 1, self.name, self.owner)
        self._acquired = False
        return result == 1

    def renew(self, extend_ms: int = 30000) -> bool:
        if not self._acquired:
            return False
        result = self.client.eval(
            self.RENEW_SCRIPT, 1, self.name, self.owner, str(extend_ms)
        )
        return result == 1

    def __enter__(self) -> "RedisLock":
        if not self.acquire():
            raise RuntimeError(f"Failed to acquire lock: {self.name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.release()


conn = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

with RedisLock(conn, "lock:order:pay:50001", timeout=30) as lock:
    print("Processing payment...")
    lock.renew(extend_ms=30000)
```

## Fencing Token（Lua）

```lua
-- 获取锁并返回单调递增的 fencing token
-- KEYS[1] = lock_key, KEYS[2] = fencing_counter_key
-- ARGV[1] = owner, ARGV[2] = timeout_seconds
local acquired = redis.call("SET", KEYS[1], ARGV[1], "NX", "EX", tonumber(ARGV[2]))
if acquired then
    local token = redis.call("INCR", KEYS[2])
    return token
end
return -1
```

## Watchdog 自动续期

```python
import threading
import time
import uuid
import redis


class WatchdogLock:
    """带 watchdog 自动续期的分布式锁。"""

    RELEASE_SCRIPT = """
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
end
return 0
"""

    def __init__(
        self, client: redis.Redis, name: str, timeout: int = 30
    ) -> None:
        self.client = client
        self.name = name
        self.timeout = timeout
        self.owner = str(uuid.uuid4())
        self._stop_event = threading.Event()
        self._watchdog: threading.Thread | None = None

    def _run_watchdog(self) -> None:
        interval = self.timeout / 3
        while not self._stop_event.wait(timeout=interval):
            self.client.eval(
                'if redis.call("GET", KEYS[1]) == ARGV[1] then '
                'return redis.call("EXPIRE", KEYS[1], ARGV[2]) end return 0',
                1,
                self.name,
                self.owner,
                str(self.timeout),
            )

    def acquire(self) -> bool:
        if self.client.set(self.name, self.owner, nx=True, ex=self.timeout):
            self._stop_event.clear()
            self._watchdog = threading.Thread(
                target=self._run_watchdog, daemon=True
            )
            self._watchdog.start()
            return True
        return False

    def release(self) -> bool:
        self._stop_event.set()
        if self._watchdog is not None:
            self._watchdog.join(timeout=2)
        result = self.client.eval(self.RELEASE_SCRIPT, 1, self.name, self.owner)
        return result == 1


conn = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)
wlock = WatchdogLock(conn, "lock:report:generate:daily", timeout=30)
if wlock.acquire():
    try:
        time.sleep(0.1)
    finally:
        wlock.release()
```
