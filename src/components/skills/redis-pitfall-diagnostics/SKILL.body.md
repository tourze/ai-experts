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
