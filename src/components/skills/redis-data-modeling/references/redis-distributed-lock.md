---
name: redis-distributed-lock
description: "当用户要实现或排查 Redis 分布式锁时使用。适用于跨进程互斥与资源竞争控制。"
---

# Redis Distributed Lock

## 适用场景

- 跨进程互斥：订单支付、库存扣减、幂等提交。
- 缓存刷新互斥保护，配合 [redis-caching-patterns](../../redis-caching-patterns/SKILL.md)。
- 定时任务单实例执行保证，防止多 worker 重复执行。
- 长任务需要锁续期（watchdog），集群下参考 [redis-cluster-ha](../../redis-cluster-ha/SKILL.md)。
- 完整代码（上下文管理器、watchdog、fencing token）见 [references/code-patterns.md](./code-patterns.md)。

## 核心约束

- 获取锁必须用 `SET key value NX EX seconds` 单条原子命令，严禁 `SETNX` + `EXPIRE`。
- value 必须是唯一 owner token（UUID），释放时 Lua 校验 owner 后再 DEL。
- 锁超时必须大于业务最大执行时间，或用 watchdog 自动续期。
- Redlock 需 5 个独立实例，获取多数派（N/2+1）且扣除获取耗时。
- 键名格式 `lock:{resource}:{id}`，遵循 [redis-key-design](./redis-key-design.md)。

## 代码模式

```redis
SET lock:order:pay:50001 "550e8400-uuid" NX EX 30

EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0" 1 lock:order:pay:50001 "550e8400-uuid"
```

## 检查清单

- 是否用 `SET key value NX EX` 单条命令，而非两步操作。
- 释放锁是否通过 Lua 校验 owner，防止误删他人锁。
- 锁超时是否大于业务执行时间，长任务是否有 watchdog。
- 获取失败是否有限重试 + 退避，避免忙等。
- 多实例场景是否评估了 Redlock 和时钟偏移风险。

## 反模式

### FAIL: SETNX + EXPIRE 两步

```python
if client.setnx(lock_key, owner):
    # 进程在这里崩溃 → 锁永远不过期 → 死锁
    client.expire(lock_key, 30)
    do_work()
```

### PASS: 单条原子命令

```python
acquired = client.set(lock_key, owner, nx=True, ex=30)
if acquired:
    do_work()
# 即使下一行崩溃，30s 后自动释放
```

### FAIL: 释放不校验 owner

```python
# 进程 A 拿锁，慢任务超过 30s，锁已过期
# 进程 B 拿到同一把锁
# 进程 A 完成，执行：
client.delete(lock_key)  # 删了 B 的锁！
```

### PASS: Lua 校验 + DEL

```python
RELEASE_SCRIPT = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
"""
client.eval(RELEASE_SCRIPT, 1, lock_key, owner)
# 只有 owner 匹配才删除
```

### FAIL: 长任务无 watchdog

```python
client.set(lock_key, owner, nx=True, ex=10)
process_large_file()  # 实际耗时 60s
# 锁 10s 已过期 → 其他进程拿到同一把锁 → 并发处理同一文件
```

### PASS: watchdog 自动续期

```python
def watchdog():
    while running:
        time.sleep(3)
        client.eval(RENEW_SCRIPT, 1, lock_key, owner, 10)

threading.Thread(target=watchdog, daemon=True).start()
try:
    process_large_file()
finally:
    running = False
    client.eval(RELEASE_SCRIPT, 1, lock_key, owner)
```
