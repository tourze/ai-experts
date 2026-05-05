# Doctrine 批处理 — 进阶代码模式与反模式

本文件是 doctrine-batch-processing SKILL.md 的拆分内容，包含 DBAL 批量更新、Migration 模式及额外反模式的完整代码。

## DBAL 批量更新

```php
<?php

final class BulkStatusUpdater
{
    public function __construct(
        private readonly \Doctrine\DBAL\Connection $connection,
    ) {}

    public function archiveExpired(): int
    {
        return $this->connection->executeStatement(
            'UPDATE orders SET status = :archived WHERE expires_at < NOW() AND status = :active',
            ['archived' => 'archived', 'active' => 'active'],
        );
    }
}
```

## Migration 模式

```php
<?php

final class Version20260414000000 extends \Doctrine\Migrations\AbstractMigration
{
    public function up(\Doctrine\DBAL\Schema\Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_orders_status_created_at ON orders (status, created_at)');
    }
}
```

## 反模式：ORM 做大批量 UPDATE

### FAIL: ORM 逐条更新

```php
foreach ($em->getRepository(Order::class)->findExpired() as $order) {
    $order->setStatus('archived');  // 100 万次 SELECT + 100 万次 UPDATE
}
$em->flush();
```

### PASS: DBAL 一条 SQL

```php
$rows = $conn->executeStatement(
    'UPDATE orders SET status = :archived
     WHERE expires_at < NOW() AND status = :active',
    ['archived' => 'archived', 'active' => 'active']
);
// 一条 SQL，毫秒级完成
```

## 反模式：改旧 migration

### FAIL: 修改已落库的 migration

```php
// 已经在所有环境跑过的 migration
final class Version20260101 extends AbstractMigration {
    public function up(Schema $s): void {
        $this->addSql('CREATE TABLE users (...)');
        // ↓ 后来直接加进去 ↓
        $this->addSql('ALTER TABLE users ADD COLUMN locale VARCHAR(10)');
    }
}
// 新环境一次跑成功，老环境少了 ALTER → 数据库分叉
```

### PASS: 新建 migration

```php
final class Version20260415_AddUserLocale extends AbstractMigration {
    public function up(Schema $s): void {
        $this->addSql('ALTER TABLE users ADD COLUMN locale VARCHAR(10) NOT NULL DEFAULT \'en\'');
    }
    public function down(Schema $s): void {
        $this->addSql('ALTER TABLE users DROP COLUMN locale');
    }
}
```
