---
name: doctrine-batch-processing
description: 当用户要实现或修复 Symfony / Doctrine 批处理、批量导入、数据回填或大数据量写入时使用。
---

# Doctrine 批处理

## 适用场景

- 需要在 Symfony 项目里实现大批量导入、批量更新、数据回填或历史数据迁移。
- Doctrine ORM 在长循环中内存上涨、SQL 日志过多、`UnitOfWork` 膨胀或 `flush()` 过慢。
- 需要判断某段批处理应该继续走 ORM，还是切到 DBAL / 原生 SQL。
- 如果批处理由异步消息驱动，可联动 [symfony-messenger](../symfony-messenger/SKILL.md)；如果涉及权限边界，可联动 [symfony-voters](../symfony-voters/SKILL.md)。
- 更细的示例和命令参考见 [reference.md](reference.md)。

## 核心约束

- 默认假设数据量会增长：不要用 `findAll()`、不要把全量结果一次性放进内存。
- ORM 批处理必须显式控制 `flush()` / `clear()` 节奏，避免 `UnitOfWork` 无限膨胀。
- 结构变更必须走 migration；不要手改已落库的历史迁移文件来“修补”生产状态。
- 能用 DBAL 一条 SQL 完成的批量更新，不要为了“统一风格”强行绕回 ORM。
- 长事务要谨慎：批次大小、锁持有时间和回滚成本必须一起评估。

## 代码模式

```php
<?php

$batchSize = 200;
$processed = 0;
$query = $entityManager->createQuery('SELECT p FROM App\\Entity\\Product p');

foreach ($query->toIterable() as $product) {
    $product->setProcessedAt(new \DateTimeImmutable());
    ++$processed;

    if ($processed % $batchSize === 0) {
        $entityManager->flush();
        $entityManager->clear();
    }
}

$entityManager->flush();
$entityManager->clear();
```

DBAL 批量更新、Migration 模式的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 批处理是否避免了 `findAll()`、级联加载和无界集合遍历。
- 是否为每个批次定义了明确的 `flush()` / `clear()` 节点和批次大小。
- SQL 日志、事件监听器和二级缓存是否会放大批处理成本。
- 迁移是否可回滚、可重复验证，并与生产数据量和锁影响相匹配。
- 如果批量修改跨越多个表，是否明确了事务边界、索引命中和失败恢复策略。

## 反模式

### FAIL: findAll + 每条 flush

```php
foreach ($em->getRepository(Product::class)->findAll() as $product) {
    $product->setProcessedAt(new \DateTimeImmutable());
    $em->flush();  // 100 万次 flush
}
// 内存爆 + UnitOfWork 越堆越大 + 数据库锁竞争
```

### PASS: toIterable + 分批 clear

```php
$batch = 200;
$i = 0;
foreach ($em->createQuery('SELECT p FROM App\Entity\Product p')->toIterable() as $product) {
    $product->setProcessedAt(new \DateTimeImmutable());
    if (++$i % $batch === 0) {
        $em->flush();
        $em->clear();  // 释放 UnitOfWork
    }
}
$em->flush();
$em->clear();
```

ORM 大批量 UPDATE、改旧 migration 等反模式的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。
