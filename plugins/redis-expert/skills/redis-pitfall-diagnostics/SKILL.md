---
name: redis-pitfall-diagnostics
description: "当用户遇到 Redis 诡异行为、性能抖动、OOM、key 过期异常、持久化丢数据、主从不一致、复制失败或想系统排查 Redis 坑位时使用。适用于把症状映射到命令复杂度、过期语义、AOF/RDB、主从复制、版本差异和配置契约。"
---

# Redis Pitfall Diagnostics

## 适用场景

- key 设置了 TTL 后变成不过期，或大量 key 过期时间异常。
- Redis 延迟抖动、单命令阻塞、`SLOWLOG` 出现 `DEL` / `KEYS` / `SETBIT` / `RANDOMKEY` / `MONITOR`。
- RDB / AOF / rewrite / `fork` 期间 OOM、卡顿或数据丢失窗口不符合预期。
- Sentinel / replica / Cluster 场景下主从数据不一致、故障切换后缓存雪崩、全量同步反复失败。
- 需要把线上症状整理成可验证假设，而不是凭经验罗列 Redis 常识。

## 核心约束

- 先收集证据再给结论：Redis 版本、角色、`INFO`、`CONFIG GET`、`SLOWLOG`、命令调用点、key 类型与元素数缺一不可。
- 每个异常都先归类到四个根因面：命令语义、内存/持久化、复制/故障切换、版本/配置差异。
- 不把官方复杂度写成绝对安全：`O(1)` 命令仍可能因内存分配、过期扫描、输出缓冲或后台 IO 变成风险点。
- 主从问题必须同时核对 Redis 版本、实例角色、时钟偏移、`maxmemory` / `maxmemory-policy` / `replica-ignore-maxmemory`。
- 删除大 key 前先量化 `TYPE`、`MEMORY USAGE` 和元素数，优先 `UNLINK` 或分批删，禁止无证据批量 `DEL`。
- 持久化风险必须说明 RPO / RTO：AOF `appendfsync everysec` 不是强一致写入承诺，RDB / AOF rewrite 需要预留 `fork` + COW 内存。
- 展开命令与现场模板见 [references/code-patterns.md](references/code-patterns.md)。

## 代码模式

```redis
# 过期语义：SET 不带 EX/PX/EXAT/PXAT/KEEPTTL 会覆盖值并清掉旧 TTL
SET session:abc "v1" EX 1800
TTL session:abc
SET session:abc "v2"
TTL session:abc

# 安全替代：明确续 TTL 或保留 TTL
SET session:abc "v3" EX 1800
SET session:abc "v4" KEEPTTL
```

```redis
# big key 删除前先量化，再决定 UNLINK 或分批删除
TYPE feed:timeline:10042
MEMORY USAGE feed:timeline:10042
LLEN feed:timeline:10042
UNLINK feed:timeline:10042
```

```redis
# 主从 / 持久化证据面；更多命令见 references/code-patterns.md
INFO server
INFO replication
SLOWLOG GET 20
```

## 检查清单

- 症状是否绑定到具体时间窗、实例角色、Redis 版本和调用方。
- 是否检查 `SET` 覆盖值时未带 TTL 选项，导致旧 TTL 被清掉。
- 是否存在 `KEYS`、`MONITOR`、大集合 `DEL`、超大 offset `SETBIT`、高频 `RANDOMKEY`。
- 是否量化 big key：类型、元素数、内存、编码方式和删除方式。
- 是否确认 AOF 刷盘策略、磁盘 IO、rewrite / RDB 快照期间 COW 余量。
- 是否核对主从复制为异步语义，分布式锁或强一致数据是否误依赖 replica 已同步。
- 是否核对主从时钟、`maxmemory` 配置一致性、`replica-ignore-maxmemory` 和是否允许 replica 写入。
- 是否检查全量同步失败链路：RDB 大小、replica 加载耗时、复制缓冲区和 master 写入速率。

## 反模式

### FAIL: 根据单个现象直接给结论

```
现象：从库查到主库查不到
结论：Redis 主从复制坏了
```

问题：没有核对版本、命令类型、实例时钟、过期策略和 replica 配置，容易把正常语义或旧版本行为误判成复制故障。

### PASS: 用可证伪假设排查

```
1. 记录 master / replica 的 redis_version、role、系统时间。
2. 对同一个 key 分别执行 TTL、TYPE、GET / EXISTS。
3. 查应用命令路径是否直接读 replica。
4. 再判断是版本语义、时钟偏移、过期清理还是复制延迟。
```

### FAIL: 看到 O(1) 就认为线上安全

```redis
SETBIT bitmap:uv 4294967295 1
RANDOMKEY
MONITOR
```

这些命令的官方复杂度或语义不能覆盖所有运行时代价：大 offset 会分配中间内存，`RANDOMKEY` 可能受过期 key 影响，`MONITOR` 会持续输出所有命令。

### PASS: 先看运行时代价

```redis
INFO commandstats
SLOWLOG GET 20
MEMORY USAGE bitmap:uv
CLIENT LIST
```

先确认命令频率、慢查询、内存增长和客户端输出缓冲，再决定限流、替换命令或调整结构。
