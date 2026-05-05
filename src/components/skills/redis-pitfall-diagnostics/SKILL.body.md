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
