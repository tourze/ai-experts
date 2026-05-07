# Doctrine Entity Patterns 参考

## Entity 基础映射

```php
<?php

namespace App\TrafficOrderBundle\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OrderRepository::class)]
#[ORM\Table(name: 'traffic_order')]
#[ORM\Index(columns: ['status', 'created_at'], name: 'idx_status_created')]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 64, options: ['comment' => '订单编号'])]
    private string $orderNo;

    #[ORM\Column(type: Types::JSON, options: ['comment' => '扩展数据'])]
    private array $extra = [];

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function getId(): ?int { return $this->id; }
}
```

## 关联关系

```php
<?php

// 一对多 + 级联 + orphanRemoval
#[ORM\OneToMany(
    mappedBy: 'order',
    targetEntity: OrderItem::class,
    cascade: ['persist', 'remove'],
    orphanRemoval: true,
)]
private Collection $items;

// 多对一（反向）
#[ORM\ManyToOne(targetEntity: Order::class, inversedBy: 'items')]
#[ORM\JoinColumn(nullable: false)]
private Order $order;

// 构造函数初始化集合
public function __construct()
{
    $this->items = new ArrayCollection();
}
```

## Entity Trait 复用

```php
<?php

trait TimestampableAware
{
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
```

```php
<?php

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class Order
{
    use TimestampableAware;
    // ...
}
```

## Repository

```php
<?php

namespace App\TrafficOrderBundle\Repository;

use App\TrafficOrderBundle\Entity\Order;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\DependencyInjection\Attribute\Autoconfigure;

#[Autoconfigure(public: true)]
class OrderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Order::class);
    }

    /** @return Order[] */
    public function findPendingBefore(\DateTimeImmutable $before, int $limit = 100): array
    {
        return $this->createQueryBuilder('o')
            ->where('o.status = :status')
            ->andWhere('o.createdAt < :before')
            ->setParameter('status', 'pending')
            ->setParameter('before', $before)
            ->orderBy('o.createdAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function save(Order $entity, bool $flush = true): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
```

## Migration

```php
<?php

namespace App\TrafficOrderBundle\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260415000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '创建 traffic_order 表';
    }

    public function up(Schema $schema): void
    {
        $table = $schema->createTable('traffic_order');
        $table->addColumn('id', 'integer', ['autoincrement' => true]);
        $table->addColumn('order_no', 'string', ['length' => 64]);
        $table->addColumn('status', 'string', ['length' => 32, 'default' => 'pending']);
        $table->addColumn('created_at', 'datetime_immutable');
        $table->setPrimaryKey(['id']);
        $table->addIndex(['status', 'created_at'], 'idx_status_created');
        $table->addUniqueIndex(['order_no'], 'uniq_order_no');
        $table->addOption('comment', '流量订单表');
    }

    public function down(Schema $schema): void
    {
        $schema->dropTable('traffic_order');
    }
}
```

## Doctrine 事件监听

```php
<?php

use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\ORM\Event\PostPersistEventArgs;

#[AsDoctrineListener(event: Events::postPersist, priority: -99)]
final readonly class OrderAuditListener
{
    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Order) {
            return;
        }
        // 审计日志写入
    }
}
```

## 调试命令

- `php bin/console doctrine:mapping:info` — 列出所有已映射 Entity。
- `php bin/console doctrine:schema:validate` — 校验映射与数据库结构一致性。
- `php bin/console doctrine:migrations:diff` — 根据映射差异生成 Migration。
- `php bin/console doctrine:migrations:migrate` — 执行待执行的 Migration。
- `php bin/console doctrine:query:dql "SELECT o FROM App\Entity\Order o"` — 执行 DQL 查询。

## 常见失败模式

- `cascade: ['remove']` 导致删除父实体时级联删除大量子记录，锁表。
- 忘记在构造函数初始化 `Collection`，运行时 `null` 上调用 `add()`。
- `EAGER` fetch 在列表页加载所有关联，内存暴涨。
- Migration 中用 `addSql()` 写了数据回填逻辑，与结构变更混在一起无法单独回滚。
- Entity 字段改名但不生成 Migration，开发环境和生产库结构漂移。
