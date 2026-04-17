# mysql-expert

MySQL 专家插件，覆盖表结构设计、索引策略、主从复制运维、事务与锁诊断、JSON 与生成列。

## 依赖

- [database-expert](../database-expert/README.md) — 提供跨 DBMS 的 SQL 审查（`sql-code-review`）和 SQL 调优（`sql-optimization`）

## Skills

| Skill | 用途 |
|-------|------|
| `mysql-index-strategy` | 索引布局、复合索引、覆盖索引与 EXPLAIN |
| `mysql-json-generated-columns` | JSON 列、虚拟列、存储生成列与索引化 |
| `mysql-replication-ops` | 主从复制、GTID、半同步与故障切换 |
| `mysql-schema-design` | MySQL 表结构、列类型、字符集与主键设计 |
| `mysql-transaction-locking` | 事务隔离、行锁、间隙锁与死锁诊断 |

## 安装

```bash
claude plugin install mysql-expert@ai-experts
```

## 卸载

```bash
claude plugin uninstall mysql-expert
claude plugin uninstall mysql-expert --scope project
```

## 验证

```bash
node --test plugins/mysql-expert/tests/*.test.mjs
```
