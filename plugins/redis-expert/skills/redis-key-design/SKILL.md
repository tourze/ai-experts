---
name: redis-key-design
description: "当用户要设计 Redis 键命名规范、命名空间、TTL 策略或生命周期管理时使用。适用于多业务共享实例的键空间治理。"
---

# Redis Key Design

## 适用场景

- 多服务共享 Redis 实例，需要统一键命名规范避免冲突。
- 需要制定 TTL 抖动策略防止缓存雪崩，配合 [redis-caching-patterns](../redis-caching-patterns/SKILL.md)。
- 需要巡检存量键的内存占用和编码方式，做容量评估。
- 数据结构选型落地时确定键前缀，联动 [redis-data-structures](../redis-data-structures/SKILL.md)。
- 完整代码示例见 [references/code-patterns.md](references/code-patterns.md)。

## 核心约束

- 键名格式 `{service}:{object_type}:{id}`，冒号分隔，全小写，禁止空格和特殊字符。
- 生产环境严禁 `KEYS *`，必须用 `SCAN` + `MATCH` + `COUNT`。
- 所有临时键必须设置 TTL 且带随机抖动，永久键需文档登记。
- 单 key value 不超过 10 KB（String）或 5000 元素（集合类），超出需拆分。
- 用 `MEMORY USAGE` 和 `OBJECT ENCODING` 定期审计键内存。

## 代码模式

```redis
SET user-svc:profile:10042 '{"name":"alice"}' EX 3600
SET lock:order:pay:50001 "owner-uuid" NX EX 30
SET stats:api:hits:2024-01-15 0 EX 172800
```

## 检查清单

- 所有键是否遵循三段式命名，无裸键或无前缀键。
- TTL 是否带随机抖动，是否存在大量相同固定 TTL 的键。
- 是否有使用 `KEYS` 的代码路径（必须替换为 `SCAN`）。
- 单 value 大小和集合元素数是否在阈值内。
- 永久键是否有文档记录用途和负责团队。

## 反模式

- 使用无前缀裸键名（如 `user:10042`），多服务共享时冲突。
- 整个 JSON 对象序列化成超大 String，应拆分到 Hash 或按子对象分键。
- 所有键用相同固定 TTL，大量键同时过期导致雪崩。
- 生产环境 `KEYS pattern` 阻塞主线程，导致服务不可用。
