# 命名空间与目录不匹配

## 影响程度
**高** - 命名空间与目录不匹配会导致自动加载失败。

## 问题
命名空间声明与目录结构不匹配，破坏 PSR-4 自动加载。

## 为什么重要
- **自动加载失败**：找不到类
- **违反 PSR-4**：破坏 PHP 自动加载标准
- **跨平台问题**：在 Windows 上正常，在 Linux 上失败
- **造成混淆**：误导性的文件组织

## ❌ 错误示例

**目录结构**：
```
app/
└── domain/
    └── order/
        └── entity/
            └── Order.php
```

**文件内容**：
```php
<?php

declare(strict_types=1);

// ❌ 命名空间与目录不匹配
namespace app\Domain\Order\Entity;

final class Order
{
    // ...
}
```

**问题所在**：目录是 `domain/order/entity/`，但命名空间是 `Domain\Order\Entity`（大小写不同）。

## ✅ 正确示例

**目录结构**：
```
app/
└── domain/
    └── order/
        └── entity/
            └── Order.php
```

**文件内容**：
```php
<?php

declare(strict_types=1);

// ✅ 命名空间与目录完全匹配
namespace app\domain\order\entity;

final class Order
{
    // ...
}
```

## PSR-4 映射规则

### Composer 配置
```json
{
    "autoload": {
        "psr-4": {
            "app\\": "app/"
        }
    }
}
```

### 映射示例

| 文件路径 | 命名空间 | 类名 |
|----------|----------|------|
| `app/domain/order/entity/Order.php` | `app\domain\order\entity` | `Order` |
| `app/service/order/CreateOrderService.php` | `app\service\order` | `CreateOrderService` |
| `app/contract/repository/OrderRepositoryInterface.php` | `app\contract\repository` | `OrderRepositoryInterface` |

### 规则
1. 命名空间前缀（`app\`）映射到基础目录（`app/`）
2. 命名空间段映射到子目录
3. 类名映射到文件名
4. 大小写必须完全匹配（在大小写敏感的系统上）

## 完整示例

```php
<?php

declare(strict_types=1);

// ✅ 正确：匹配 app/domain/order/value_object/Money.php
namespace app\domain\order\value_object;

final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }

    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }
}
```

```php
<?php

declare(strict_types=1);

// ✅ 正确：匹配 app/infrastructure/repository/eloquent/EloquentOrderRepository.php
namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    // ...
}
```

## 常见错误

### ❌ 大小写混用
```php
// 目录：app/domain/order/
namespace app\Domain\Order;  // ❌ 大小写错误
```

### ❌ 缺少段
```php
// 目录：app/domain/order/entity/
namespace app\domain\order;  // ❌ 缺少 'entity'
```

### ❌ 多余的段
```php
// 目录：app/service/
namespace app\service\order\service;  // ❌ 多余的 'service'
```

### ❌ 分隔符错误
```php
// 目录：app/value_object/
namespace app\valueObject;  // ❌ 应为 value_object
```

## 检测

**代码审查清单**：
- [ ] 命名空间与目录结构完全匹配？
- [ ] 大小写匹配（目录全部小写）？
- [ ] 没有缺少或多余的段？
- [ ] 目录中的下划线与命名空间匹配？

**Shell 脚本检测**：
```bash
# 检查命名空间是否匹配文件路径
find app -name "*.php" -exec php -r '
    $file = $argv[1];
    $content = file_get_contents($file);
    preg_match("/namespace\s+([^;]+);/", $content, $matches);
    $namespace = $matches[1] ?? "";
    $expected = str_replace("/", "\\", dirname($file));
    if ($namespace !== $expected) {
        echo "$file: namespace mismatch\n";
        echo "  Found: $namespace\n";
        echo "  Expected: $expected\n";
    }
' {} \;
```

**Composer 命令**：
```bash
# 重新生成自动加载文件
composer dump-autoload

# 检查自动加载错误
composer validate
```

## 相关规则
- [directory-lowercase](directory-lowercase.md)
- [interface-naming](interface-naming.md)
