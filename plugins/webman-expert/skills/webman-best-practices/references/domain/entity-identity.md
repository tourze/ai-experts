# 实体标识

## 影响程度
**高** - 缺少正确标识的实体会导致数据损坏和 bug。

## 问题
领域实体没有唯一标识符，或使用基于值的相等性而非基于标识的相等性。

## 为什么重要
- **数据完整性**：实体必须可唯一标识
- **DDD 原则**：实体由标识定义，而非属性
- **持久化**：需要标识来跨会话跟踪实体
- **相等性**：数据相同但 ID 不同的两个实体是不同的

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

// ❌ 没有标识字段
final class Order
{
    private function __construct(
        private int $userId,
        private float $totalAmount,
        private string $status
    ) {
    }

    // ❌ 基于值的相等性
    public function equals(self $other): bool
    {
        return $this->userId === $other->userId
            && $this->totalAmount === $other->totalAmount
            && $this->status === $other->status;
    }
}
```

**问题所在**：数据相同的两个不同订单会被视为相等。

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    private function __construct(
        private readonly int $id,              // ✅ 唯一标识
        private readonly int $userId,
        private Money $totalAmount,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        return new self(
            id: 0,  // 由 Repository 分配
            userId: $userId,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );
    }

    // ✅ 基于标识的相等性
    public function equals(self $other): bool
    {
        return $this->id === $other->id;
    }

    // ✅ 标识访问器
    public function id(): int
    {
        return $this->id;
    }

    // 其他方法...
}
```

## 实体 vs 值对象

### 实体特征
- ✅ 拥有唯一标识（ID）
- ✅ 基于标识的相等性
- ✅ 可变状态（可随时间变化）
- ✅ 有生命周期（创建、修改、删除）

### 值对象特征
- ✅ 没有标识
- ✅ 基于值的相等性
- ✅ 不可变
- ✅ 可替换

## 完整示例

```php
<?php

declare(strict_types=1);

namespace app\domain\user\entity;

use app\domain\user\value_object\Email;
use app\domain\user\value_object\UserStatus;

final class User
{
    private function __construct(
        private readonly int $id,                      // ✅ 标识
        private readonly Email $email,                 // ✅ 不可变
        private readonly \DateTimeImmutable $createdAt, // ✅ 不可变
        private string $name,                          // ❌ 可变
        private UserStatus $status,                    // ❌ 可变
        private ?\DateTimeImmutable $emailVerifiedAt = null
    ) {
    }

    public static function create(Email $email, string $name): self
    {
        return new self(
            id: 0,
            email: $email,
            createdAt: new \DateTimeImmutable(),
            name: $name,
            status: UserStatus::pending()
        );
    }

    // ✅ 基于标识的相等性
    public function equals(self $other): bool
    {
        return $this->id === $other->id;
    }

    // ✅ 标识访问器
    public function id(): int
    {
        return $this->id;
    }

    // 可变操作
    public function changeName(string $name): void
    {
        $this->name = $name;
    }

    public function activate(): void
    {
        $this->status = UserStatus::active();
    }

    public function verifyEmail(): void
    {
        $this->emailVerifiedAt = new \DateTimeImmutable();
    }
}
```

## 检测

**代码审查清单**：
- [ ] 实体有 `id` 字段？
- [ ] `id` 是 readonly？
- [ ] `equals()` 方法使用标识而非值？
- [ ] 实体在 `domain/*/entity/` 目录中？

## 相关规则
- [value-object-immutability](value-object-immutability.md) - 值对象不可变
- [rich-domain-model](rich-domain-model.md) - 实体包含行为
