# Redis Cluster & HA — Code Patterns

## Sentinel 核心配置

```redis
# sentinel.conf
sentinel monitor mymaster 192.168.1.10 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1
sentinel auth-pass mymaster your-strong-password
requirepass sentinel-password
```

## Cluster 模式配置

```redis
# redis.conf — Cluster 节点
port 7000
cluster-enabled yes
cluster-config-file nodes-7000.conf
cluster-node-timeout 15000

appendonly yes
aof-use-rdb-preamble yes

maxmemory 4gb
maxmemory-policy allkeys-lru

slowlog-log-slower-than 10000
slowlog-max-len 256
```

## maxmemory 与淘汰策略

```redis
INFO memory
CONFIG SET maxmemory 4gb

# allkeys-lru    — 所有键按 LRU 淘汰（通用缓存推荐）
# volatile-lru   — 仅淘汰设 TTL 的键（混合场景）
# allkeys-lfu    — 所有键按 LFU 淘汰（热点数据场景）
# noeviction     — 不淘汰，写满拒绝写入（数据不可丢失场景）
CONFIG SET maxmemory-policy allkeys-lru
```

## SLOWLOG 慢查询分析

```redis
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET
```

## INFO memory 解析（Python）

```python
import redis

client = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def parse_memory_info() -> dict[str, str]:
    """解析 Redis INFO memory 关键指标。"""
    info = client.info("memory")
    return {
        "used_memory_human": info.get("used_memory_human", "N/A"),
        "used_memory_peak_human": info.get("used_memory_peak_human", "N/A"),
        "used_memory_rss_human": info.get("used_memory_rss_human", "N/A"),
        "mem_fragmentation_ratio": str(info.get("mem_fragmentation_ratio", "N/A")),
        "maxmemory_human": info.get("maxmemory_human", "N/A"),
        "maxmemory_policy": info.get("maxmemory_policy", "N/A"),
    }


def check_slowlog(threshold_ms: float = 10.0) -> list[dict]:
    """获取慢查询日志并过滤超过阈值的条目。"""
    entries = client.slowlog_get(num=50)
    slow = []
    for entry in entries:
        duration_ms = entry.get("duration", 0) / 1000.0
        if duration_ms >= threshold_ms:
            slow.append({
                "id": entry.get("id"),
                "duration_ms": duration_ms,
                "command": str(entry.get("command", "")),
            })
    return slow


mem = parse_memory_info()
for k, v in mem.items():
    print(f"{k}: {v}")

slow_queries = check_slowlog()
for sq in slow_queries:
    print(f"Slow query #{sq['id']}: {sq['duration_ms']}ms — {sq['command']}")
```
