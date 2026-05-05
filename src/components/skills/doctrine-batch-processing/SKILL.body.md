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
