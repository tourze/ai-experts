# Service 命名模式

## 影响程度
**低** - 命名不一致导致代码难以导航，但不影响功能。

## 问题
Service 类未遵循 `VerbNounService` 命名模式，导致不清楚该 Service 的职责。

## 为什么重要
- **清晰性**：名称直接表明 Service 的职责
- **一致性**：所有 Service 遵循统一模式
- **可搜索性**：按动作轻松查找 Service
- **单一职责**：鼓励 Service 保持专注

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

// ❌ 过于通用
final class OrderService
{
    public function create(): void { }
    public function cancel(): void { }
    public function refund(): void { }
    // 职责过多
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\user;

// ❌ 只有名词，不清楚做什么
final class UserManager
{
    public function handle(): void { }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\payment;

// ❌ 只有动词，不清楚操作对象
final class ProcessService
{
    public function execute(): void { }
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

// ✅ 清晰：创建订单
final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

// ✅ 清晰：取消订单
final class CancelOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);
        $order->cancel();
        $this->orderRepository->save($order);
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\payment;

use app\contract\gateway\PaymentGatewayInterface;

// ✅ 清晰：处理支付
final class ProcessPaymentService
{
    public function __construct(
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $orderId, string $paymentMethod): void
    {
        $this->paymentGateway->charge($orderId, $paymentMethod);
    }
}
```

## 命名模式

### 格式
```
{动词}{名词}Service
```

### 常用动词
- **Create** - 创建新实体
- **Update** - 修改现有实体
- **Delete** - 删除实体
- **Get/Find** - 获取实体
- **List** - 获取集合
- **Process** - 复杂操作
- **Send** - 发送通知/消息
- **Calculate** - 计算
- **Validate** - 校验逻辑
- **Import/Export** - 数据传输

### 示例
```php
✅ CreateUserService
✅ UpdateProfileService
✅ DeleteAccountService
✅ GetOrderDetailsService
✅ ListProductsService
✅ ProcessPaymentService
✅ SendEmailService
✅ CalculateTaxService
✅ ValidateAddressService
✅ ImportCsvService

❌ UserService（过于通用）
❌ OrderManager（不是 Service）
❌ PaymentHandler（后缀不一致）
❌ CreateService（缺少名词）
❌ OrderCreator（缺少 Service 后缀）
```

## 方法命名

Service 应有单个公共方法：

```php
✅ handle()           // 推荐
✅ execute()          // 替代方案
✅ create()           // 如果 Service 名为 CreateXxxService
✅ process()          // 如果 Service 名为 ProcessXxxService

❌ run()              // 过于通用
❌ doSomething()      // 不清晰
❌ perform()          // 含糊
```

## 检测

**代码审查清单**：
- [ ] Service 类名遵循 `VerbNounService` 模式？
- [ ] Service 只有单个公共方法（通常为 `handle()`）？
- [ ] Service 名称清晰描述其职责？
- [ ] Service 在正确的命名空间中（`app\service\{context}\`）？

## 相关规则
- [interface-naming](interface-naming.md) - 接口命名规范
- [directory-lowercase](directory-lowercase.md) - 目录命名
