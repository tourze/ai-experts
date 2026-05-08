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

DBAL 批量更新、Migration 模式的完整代码见 [references/advanced-patterns.md](./advanced-patterns.md)。
