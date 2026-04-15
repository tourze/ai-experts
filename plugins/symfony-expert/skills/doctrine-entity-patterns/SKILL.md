---
name: doctrine-entity-patterns
description: 设计和审查 Doctrine ORM Entity 的属性映射、关联关系、Repository、Migration 与生命周期回调
---

# Doctrine Entity Patterns

## 适用场景

- 新建或审查 Entity 列映射、关联、索引、Repository 和 Migration。
- 排查 N+1、懒加载异常、级联删除或 UnitOfWork 性能问题。
- 批处理联动 [doctrine-batch-processing](../doctrine-batch-processing/SKILL.md)；Bundle 组织联动 [symfony-bundle-architecture](../symfony-bundle-architecture/SKILL.md)。完整示例见 [reference.md](reference.md)。

## 核心约束

- 用 PHP 8 Attributes 映射，不用注解。
- ID 生成策略必须显式声明。
- 关联必须明确 `cascade`、`orphanRemoval` 和反向归属。
- 时间字段用 `DateTimeImmutable`。
- Repository 继承 `ServiceEntityRepository`；Migration 只做结构变更。

## 代码模式

见 [reference.md](reference.md)。

## 检查清单

- 列映射是否用 Attributes 且有 `comment`。
- 关联是否声明了 `mappedBy`/`inversedBy` 和 `cascade`。
- Repository 是否避免了 `findAll()` 和无界查询。
- Migration 是否可回滚、有索引和外键。
- 集合遍历是否用了 `JOIN FETCH` 或 `toIterable()` 防 N+1。

## 反模式

- 用 `DateTime` 而非 `DateTimeImmutable`。
- 关联缺反向声明。
- 修改已落库的历史 Migration。
- Entity 里写业务逻辑。
