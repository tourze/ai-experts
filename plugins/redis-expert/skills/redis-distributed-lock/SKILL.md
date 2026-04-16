---
name: redis-distributed-lock
description: "当用户要实现或排查 Redis 分布式锁时使用。适用于跨进程互斥与资源竞争控制。"
---

# Redis Distributed Lock

## 适用场景

- 跨进程互斥：订单支付、库存扣减、幂等提交。
- 缓存刷新互斥保护，配合 [redis-caching-patterns](../redis-caching-patterns/SKILL.md)。
- 定时任务单实例执行保证，防止多 worker 重复执行。
- 长任务需要锁续期（watchdog），集群下参考 [redis-cluster-ha](../redis-cluster-ha/SKILL.md)。
- 完整代码（上下文管理器、watchdog、fencing token）见 [references/code-patterns.md](references/code-patterns.md)。

## 核心约束

- 获取锁必须用 `SET key value NX EX seconds` 单条原子命令，严禁 `SETNX` + `EXPIRE`。
- value 必须是唯一 owner token（UUID），释放时 Lua 校验 owner 后再 DEL。
- 锁超时必须大于业务最大执行时间，或用 watchdog 自动续期。
- Redlock 需 5 个独立实例，获取多数派（N/2+1）且扣除获取耗时。
- 键名格式 `lock:{resource}:{id}`，遵循 [redis-key-design](../redis-key-design/SKILL.md)。

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

- `SETNX` + `EXPIRE` 两步操作，中间崩溃导致死锁。
- 释放时直接 `DEL` 不校验 owner，删除其他进程的锁。
- 锁超时过短，业务未完成锁已过期，导致并发冲突。
- 单实例故障转移后信任锁仍有效，新主节点锁数据已丢失。
- 获取失败无限重试不设上限，耗尽连接池。
