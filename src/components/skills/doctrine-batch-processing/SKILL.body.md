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
