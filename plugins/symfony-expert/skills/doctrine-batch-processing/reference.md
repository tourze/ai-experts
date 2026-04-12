# 参考文档

# Doctrine 批处理

## 问题

```php
// 错误做法：将所有实体加载到内存
$products = $repository->findAll();
foreach ($products as $product) {
    $this->process($product);
}
// 大数据集下会内存溢出！
```

## 方案 1：迭代处理

```php
<?php

// 正确做法：逐条处理
$query = $em->createQuery('SELECT p FROM Product p');

foreach ($query->toIterable() as $product) {
    $this->process($product);

    // 定期清理托管实体
    $em->clear();
}
```

## 方案 2：分批处理并清理

```php
<?php

const BATCH_SIZE = 100;

$query = $em->createQuery('SELECT p FROM Product p');
$i = 0;

foreach ($query->toIterable() as $product) {
    $product->setProcessedAt(new \DateTimeImmutable());
    $i++;

    if ($i % self::BATCH_SIZE === 0) {
        $em->flush();
        $em->clear();
        gc_collect_cycles();
    }
}

// 刷新剩余数据
$em->flush();
$em->clear();
```

## 方案 3：基于 ID 的分页

```php
<?php

class BatchProcessor
{
    private const BATCH_SIZE = 1000;

    public function processAll(): void
    {
        $lastId = 0;

        while (true) {
            $products = $this->em->createQueryBuilder()
                ->select('p')
                ->from(Product::class, 'p')
                ->where('p.id > :lastId')
                ->setParameter('lastId', $lastId)
                ->orderBy('p.id', 'ASC')
                ->setMaxResults(self::BATCH_SIZE)
                ->getQuery()
                ->getResult();

            if (empty($products)) {
                break;
            }

            foreach ($products as $product) {
                $this->process($product);
                $lastId = $product->getId();
            }

            $this->em->flush();
            $this->em->clear();
        }
    }
}
```

## 方案 4：DBAL 批量更新

```php
<?php

use Doctrine\DBAL\Connection;

class BulkUpdater
{
    public function __construct(
        private Connection $connection,
    ) {}

    public function markAllProcessed(): int
    {
        return $this->connection->executeStatement(
            'UPDATE product SET processed_at = NOW() WHERE processed_at IS NULL'
        );
    }

    public function updatePrices(array $updates): void
    {
        $this->connection->beginTransaction();

        try {
            $stmt = $this->connection->prepare(
                'UPDATE product SET price = :price WHERE id = :id'
            );

            foreach ($updates as $id => $price) {
                $stmt->executeStatement(['id' => $id, 'price' => $price]);
            }

            $this->connection->commit();
        } catch (\Exception $e) {
            $this->connection->rollBack();
            throw $e;
        }
    }
}
```

## 方案 5：批量插入

```php
<?php

class BulkInserter
{
    private const BATCH_SIZE = 500;

    public function importProducts(array $data): void
    {
        $this->em->getConnection()->getConfiguration()->setSQLLogger(null);

        $batches = array_chunk($data, self::BATCH_SIZE);

        foreach ($batches as $batch) {
            foreach ($batch as $item) {
                $product = new Product();
                $product->setName($item['name']);
                $product->setPrice($item['price']);
                $this->em->persist($product);
            }

            $this->em->flush();
            $this->em->clear();
        }
    }
}
```

## 内存监控

```php
<?php

class BatchProcessor
{
    public function process(): void
    {
        $startMemory = memory_get_usage();

        foreach ($query->toIterable() as $i => $entity) {
            $this->processEntity($entity);

            if ($i % 100 === 0) {
                $this->em->clear();

                $currentMemory = memory_get_usage();
                $this->logger->info('批处理进度', [
                    'processed' => $i,
                    'memory_mb' => round($currentMemory / 1024 / 1024, 2),
                    'memory_delta_mb' => round(($currentMemory - $startMemory) / 1024 / 1024, 2),
                ]);
            }
        }
    }
}
```

## 批处理的 Symfony 命令

```php
<?php
// src/Command/ProcessProductsCommand.php

#[AsCommand(name: 'app:process-products')]
class ProcessProductsCommand extends Command
{
    private const BATCH_SIZE = 100;

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $query = $this->em->createQuery('SELECT p FROM Product p WHERE p.processedAt IS NULL');
        $total = $this->countUnprocessed();

        $io->progressStart($total);

        $processed = 0;
        foreach ($query->toIterable() as $product) {
            $this->processor->process($product);
            $processed++;

            if ($processed % self::BATCH_SIZE === 0) {
                $this->em->flush();
                $this->em->clear();
                $io->progressAdvance(self::BATCH_SIZE);
            }
        }

        $this->em->flush();
        $io->progressFinish();

        $io->success("已处理 {$processed} 个产品");

        return Command::SUCCESS;
    }
}
```

## 最佳实践

1. **定期清理**：`$em->clear()` 释放内存
2. **使用 toIterable()**：不要一次性加载所有结果
3. **简单更新用 DBAL**：跳过 ORM 处理简单的批量更新
4. **监控内存**：在长时间运行的进程中记录内存使用情况
5. **禁用 SQL 日志**：在批处理进程中关闭
6. **进度反馈**：使用 SymfonyStyle 进度条


## Skill 操作检查清单

### 设计检查清单
- 首先确认操作边界和不变量。
- 在保持契约正确性的前提下最小化范围。
- 同时测试正常路径和异常路径行为。

### 验证命令
- php bin/console doctrine:migrations:diff
- php bin/console doctrine:migrations:migrate
- ./vendor/bin/phpunit --filter=Doctrine

### 需要测试的失败模式
- 无效负载或未授权操作者。
- 边界值/未找到的情况。
- 异步流程的重试或部分失败行为。
