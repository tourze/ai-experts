# Repository 实现命名

## 影响程度
**低** - 命名不一致导致代码难以导航。

## 问题
Repository 实现缺少描述性前缀来标识底层技术或存储机制。

## 为什么重要
- **清晰性**：名称直接表明实现技术
- **多实现区分**：便于区分不同的实现
- **可搜索性**：按技术查找实现

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository;

use app\contract\repository\OrderRepositoryInterface;

// ❌ 通用名称，不清楚使用了什么技术
final class OrderRepository implements OrderRepositoryInterface
{
    // ...
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;

// ✅ 清晰：使用 Eloquent ORM
final class EloquentOrderRepository implements OrderRepositoryInterface
{
    // ...
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\redis;

use app\contract\repository\SessionRepositoryInterface;

// ✅ 清晰：使用 Redis
final class RedisSessionRepository implements SessionRepositoryInterface
{
    // ...
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\http;

use app\contract\repository\ProductRepositoryInterface;

// ✅ 清晰：通过 HTTP API 获取
final class HttpProductRepository implements ProductRepositoryInterface
{
    // ...
}
```

## 命名模式

### 格式
```
{技术}{实体}Repository
```

### 常用前缀
- **Eloquent** - Eloquent ORM
- **Doctrine** - Doctrine ORM
- **Redis** - Redis 存储
- **Http** - HTTP API
- **InMemory** - 内存存储（用于测试）
- **File** - 文件系统
- **Mysql** - 直接 MySQL 查询
- **Postgres** - 直接 PostgreSQL 查询

### 示例
```php
✅ EloquentOrderRepository
✅ RedisSessionRepository
✅ HttpProductRepository
✅ InMemoryUserRepository
✅ FileLogRepository
✅ MysqlReportRepository

❌ OrderRepository（过于通用）
❌ OrderRepositoryImpl（impl 后缀无描述性）
❌ OrderRepo（缩写）
```

## 完整示例

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function findById(int $id): ?Order
    {
        $model = OrderModel::find($id);

        if ($model === null) {
            return null;
        }

        return $this->toDomain($model);
    }

    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->total_amount = $order->totalAmount()->toDollars();
        $model->status = $order->status()->value();
        $model->save();
    }

    private function toDomain(OrderModel $model): Order
    {
        // 从 Model 映射到领域实体
        return Order::reconstitute(/*...*/);
    }
}
```

## 检测

**代码审查清单**：
- [ ] Repository 实现带有技术前缀？
- [ ] 多个实现之间可以区分？
- [ ] 名称与目录结构匹配？

## 相关规则
- [interface-naming](./interface-naming.md)
- [service-naming-pattern](./service-naming-pattern.md)
