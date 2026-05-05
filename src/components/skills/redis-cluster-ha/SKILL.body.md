## 代码模式

```redis
# Cluster 节点核心配置
cluster-enabled yes
cluster-node-timeout 15000
appendonly yes
aof-use-rdb-preamble yes
maxmemory 4gb
maxmemory-policy allkeys-lru
slowlog-log-slower-than 10000
slowlog-max-len 256
```

## 反模式

### FAIL: maxmemory = 物理内存

```ini
maxmemory 8gb  # 物理内存就 8GB
```

```
RDB BGSAVE 触发 fork → COW 写入翻倍 → OOM Killer 终止 redis-server
→ 30s 全站不可用
```

### PASS: 留 20-30% fork 余量

```ini
# 物理 8GB
maxmemory 5gb              # 留 3GB 给 fork COW + 系统
maxmemory-policy allkeys-lru
```

### FAIL: Sentinel 2 节点

```
节点 A + 节点 B
网络分区 → A 看不到 B → A 想选举但 quorum=2 永远拿不到
→ 无法故障切换
```

### PASS: 至少 3 节点

```
节点 A + B + C，quorum = 2
任一节点死，剩 2 个仍能多数派选举
跨机房部署进一步抗机房故障
```

### FAIL: Cluster 跨 slot MGET

```python
client.mget("user:1", "user:2", "user:3")
# CROSSSLOT Keys in request don't hash to the same slot
```

### PASS: hashtag 同 slot

```python
# 用 {tag} 强制同 slot
client.mget("user:{shard1}:1", "user:{shard1}:2", "user:{shard1}:3")
# 或拆成多个 GET / 用 pipeline
pipe = client.pipeline()
for uid in [1,2,3]: pipe.get(f"user:{uid}")
pipe.execute()
```
