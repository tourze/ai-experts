# 深度索引策略

被 sql-review-optimization 引用的深度索引参考，内容源自原 db-index-strategy skill。

## 通用原则

- 复合索引列顺序遵循"等值 → 范围 → 排序"；范围条件之后的列无法被索引过滤。
- 覆盖索引避免回表；优先为高频查询设计覆盖索引。
- 单表索引控制在 5-7 个以内；每个索引增加写入时维护成本。
- 禁止在低基数列（性别、布尔值）上单独建索引；优化器可能拒绝使用。
- 新增索引后必须用 EXPLAIN 验证实际命中情况。

## MySQL 特化

- InnoDB 使用 B+Tree 聚簇索引；二级索引叶子存主键值，回表不可避免时建议覆盖索引。
- 前缀索引仅用于 TEXT/BLOB 或超长 VARCHAR；前缀索引无法用于 ORDER BY 和覆盖索引。
- 索引合并（index_merge）不如一个复合索引稳定；出现时优先评估复合索引替代。

## PostgreSQL 特化

- B-tree 用于 =/</>/BETWEEN/ORDER BY；GIN 用于 @>/?/&&/全文搜索；GiST 用于范围重叠、几何；BRIN 用于大表按物理顺序的关联列。
- 部分索引的 WHERE 必须匹配查询 WHERE（或其超集），否则 planner 无法使用。
- 覆盖索引 INCLUDE 只放小尺寸标量，不塞 TEXT/JSONB 大列。
- 定期检查 pg_stat_user_indexes.idx_scan = 0 清理未使用索引。

## 更多参考

详细引擎专有模式见同层 references/ 下的：
- [mysql-index-strategy.md](./mysql-index-strategy.md)
- [pgsql-index-strategy.md](./pgsql-index-strategy.md)
- [index-patterns.md](./index-patterns.md)
- [code-patterns.md](./code-patterns.md)
