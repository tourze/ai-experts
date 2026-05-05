# Redis Pitfall Diagnostics — Code Patterns

## 来源材料

- Kaito《颠覆认知——Redis 会遇到的 15 个坑》：按「命令使用、数据持久化、主从复制」拆解坑位。
- Redis 官方命令文档：`SET` 未带过期选项会丢弃既有 TTL；`KEYS` 属于 `@dangerous`；`DEL` 对集合类 key 的复杂度与元素数相关；`UNLINK` 把内存回收转到后台线程；`SETBIT` 大 offset 可能触发一次性内存分配。

## 排障矩阵

| 症状 | 优先假设 | 证据 | 处理 |
|------|----------|------|------|
| TTL key 变永久 | `SET` 覆盖未带过期选项 | 调用点、`TTL`、命令审计 | 使用 `EX` / `PX` / `KEEPTTL` |
| 删除后 Redis 卡顿 | big key 或集合类 `DEL` | `TYPE`、元素数、`MEMORY USAGE`、`SLOWLOG` | `UNLINK` 或分批删除 |
| bitmap 写入后 OOM / 卡顿 | `SETBIT` offset 过大 | offset、key 当前长度、内存曲线 | 限制 offset，预分配或改结构 |
| 监控期间吞吐下降 | `MONITOR` 输出流过大 | 客户端列表、QPS、输出缓冲 | 停止 `MONITOR`，改采样日志 / `SLOWLOG` |
| failover 后大量 miss | replica 时钟快或大量过期 key 被提升 | NTP、主从 TTL 差异、切换时间线 | 校准时钟，分散 TTL，演练切换 |
| 主从全量同步循环失败 | RDB 过大 + 缓冲区溢出 | `INFO replication`、日志、RDB 大小 | 控制实例体积，调大复制缓冲 |

## 最小证据采集

```redis
INFO server
INFO replication
INFO persistence
INFO memory
INFO commandstats
SLOWLOG GET 20
CLIENT LIST
```

## 配置核对

```redis
CONFIG GET appendonly appendfsync no-appendfsync-on-rewrite
CONFIG GET save rdbcompression
CONFIG GET maxmemory maxmemory-policy replica-ignore-maxmemory
CONFIG GET replica-read-only repl-backlog-size client-output-buffer-limit
```

## key 级风险量化

```redis
TYPE <key>
TTL <key>
MEMORY USAGE <key>
OBJECT ENCODING <key>

# 按类型补元素数
LLEN <list-key>
HLEN <hash-key>
SCARD <set-key>
ZCARD <zset-key>
XLEN <stream-key>
STRLEN <string-key>
```

## 安全遍历与删除

```redis
# 遍历：生产环境用 SCAN，不用 KEYS
SCAN 0 MATCH user-svc:profile:* COUNT 200

# 删除：big key 优先 UNLINK；集合类需要结合元素数评估分批删
UNLINK user-svc:profile:10042
```

## 现场记录模板

```markdown
## Redis 异常记录

- 时间窗：
- 实例：
- Redis version：
- 角色：master / replica / sentinel / cluster node
- 症状：
- 相关命令：
- key 类型与规模：
- 持久化配置：
- 复制配置：
- 已排除假设：
- 下一步验证：
```
