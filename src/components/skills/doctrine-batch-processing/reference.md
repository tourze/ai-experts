# Doctrine 批处理参考

本文件补充 `doctrine-batch-processing` 的实现细节、命令和常见故障模式。

## 先避免的错误起手式

```php
<?php

$products = $repository->findAll();
foreach ($products as $product) {
    $this->process($product);
}
```

问题：全量加载会把结果集、关联对象和 `UnitOfWork` 一起堆进内存，数据量一大就会失控。

## 推荐模式 1：`toIterable()` + 分批 `flush()` / `clear()`

```php
<?php

$batchSize = 100;
$processed = 0;
$query = $entityManager->createQuery('SELECT p FROM App\\Entity\\Product p');

foreach ($query->toIterable() as $product) {
    $product->setProcessedAt(new \DateTimeImmutable());
    ++$processed;

    if ($processed % $batchSize === 0) {
        $entityManager->flush();
        $entityManager->clear();
        gc_collect_cycles();
    }
}

$entityManager->flush();
$entityManager->clear();
```

## 推荐模式 2：基于主键的稳定分页

```php
<?php

final class BatchProcessor
{
    private const BATCH_SIZE = 1000;

    public function processAll(): void
    {
        $lastId = 0;

        while (true) {
            $products = $this->entityManager->createQueryBuilder()
                ->select('p')
                ->from(Product::class, 'p')
                ->where('p.id > :lastId')
                ->setParameter('lastId', $lastId)
                ->orderBy('p.id', 'ASC')
                ->setMaxResults(self::BATCH_SIZE)
                ->getQuery()
                ->getResult();

            if ($products === []) {
                break;
            }

            foreach ($products as $product) {
                $this->process($product);
                $lastId = $product->getId();
            }

            $this->entityManager->flush();
            $this->entityManager->clear();
        }
    }
}
```

## 推荐模式 3：DBAL 批量更新

```php
<?php

final class BulkUpdater
{
    public function __construct(
        private readonly \Doctrine\DBAL\Connection $connection,
    ) {}

    public function markAllProcessed(): int
    {
        return $this->connection->executeStatement(
            'UPDATE product SET processed_at = NOW() WHERE processed_at IS NULL'
        );
    }
}
```

## 推荐模式 4：批处理命令

```php
<?php

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:process-products')]
final class ProcessProductsCommand extends Command
{
    private const BATCH_SIZE = 100;

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $processed = 0;
        $query = $this->entityManager->createQuery(
            'SELECT p FROM App\\Entity\\Product p WHERE p.processedAt IS NULL'
        );

        foreach ($query->toIterable() as $product) {
            $this->processor->process($product);
            ++$processed;

            if ($processed % self::BATCH_SIZE === 0) {
                $this->entityManager->flush();
                $this->entityManager->clear();
                $io->writeln(sprintf('已处理 %d 条记录', $processed));
            }
        }

        $this->entityManager->flush();
        $this->entityManager->clear();
        $io->success(sprintf('批处理完成，共处理 %d 条记录', $processed));

        return Command::SUCCESS;
    }
}
```

## 验证命令

- `php bin/console doctrine:migrations:diff --formatted`
- `php bin/console doctrine:migrations:migrate --no-interaction`
- `php bin/console doctrine:schema:validate`
- `./vendor/bin/phpunit --filter=Batch`

## 需要重点验证的失败模式

- 批次间 `clear()` 缺失导致内存持续上涨。
- migration 缺索引或锁范围过大，线上执行时间异常。
- 用 ORM 回填数据时触发不必要的监听器、副作用或级联。
- 分页游标不稳定，导致重复处理或漏处理。
