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
