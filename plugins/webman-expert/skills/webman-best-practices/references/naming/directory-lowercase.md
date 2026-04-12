# 目录小写命名

## 影响程度
**中等** - 导致跨平台兼容性问题，违反 PSR-4 规范。

## 问题
目录名使用 camelCase 或 PascalCase 而非小写。这在大小写敏感的文件系统（Linux、macOS）上会导致问题，且违反 Webman 的小写目录约定。

## 为什么重要
- **跨平台问题**：代码在 Windows 上正常但在 Linux 上报错
- **PSR-4 混淆**：命名空间与目录结构不匹配
- **不一致**：混用不同命名风格
- **Webman 约定**：框架使用小写目录
- **自动加载问题**：在大小写敏感的系统上可能失败

## ❌ 错误示例

```
app/
├── Controller/              # ❌ PascalCase
├── Model/                   # ❌ PascalCase
├── Service/                 # ❌ PascalCase
├── Domain/                  # ❌ PascalCase
│   ├── Order/               # ❌ PascalCase
│   │   ├── Entity/          # ❌ PascalCase
│   │   └── ValueObject/     # ❌ PascalCase（也不对：应为 value_object）
└── Infrastructure/          # ❌ PascalCase
```

**命名空间（错误）**：
```php
<?php

namespace app\Domain\Order\Entity; // ❌ 大小写混用

final class Order
{
    // ...
}
```

## ✅ 正确示例

```
app/
├── controller/              # ✅ 小写
├── model/                   # ✅ 小写
├── service/                 # ✅ 小写
├── domain/                  # ✅ 小写
│   ├── order/               # ✅ 小写
│   │   ├── entity/          # ✅ 小写
│   │   └── value_object/    # ✅ 小写 + 下划线
└── infrastructure/          # ✅ 小写
```

**命名空间（正确）**：
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity; // ✅ 全部小写

final class Order
{
    // ...
}
```

**完整示例**：
```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object; // ✅ 小写 + 下划线

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

    public function toCents(): int
    {
        return $this->cents;
    }
}
```

## 目录命名规则

### 单个单词
```
✅ controller/
✅ service/
✅ domain/
✅ model/

❌ Controller/
❌ Service/
❌ Domain/
```

### 多个单词
使用下划线 `_` 分隔：

```
✅ value_object/
✅ domain_event/
✅ use_case/

❌ valueObject/
❌ ValueObject/
❌ domainEvent/
```

### 限界上下文
```
✅ domain/order/
✅ domain/user/
✅ domain/billing/

❌ domain/Order/
❌ domain/User/
```

## 检测

**代码审查清单**：
- [ ] `app/` 下的所有目录都是小写？
- [ ] 多词目录使用下划线？
- [ ] 命名空间与目录结构完全匹配？
- [ ] 目录名中没有大小写混用？

**Shell 脚本检测**：
```bash
# 查找包含大写字母的目录
find app -type d | grep -E '[A-Z]'

# 如果所有目录都是小写，应返回空
```

**PHPStan 规则**（自定义）：
```php
// 检查命名空间是否匹配小写目录
if (namespace_has_uppercase() && !class_name_has_uppercase()) {
    report("Namespace should be lowercase to match directory");
}
```

## 迁移指南

如果已有代码使用 PascalCase 目录：

1. **重命名目录**（Git 保留历史记录）：
```bash
git mv app/Domain app/domain
git mv app/Service app/service
git mv app/Domain/Order/ValueObject app/domain/order/value_object
```

2. **更新命名空间**（所有 PHP 文件）：
```php
// 修改前
namespace app\Domain\Order\Entity;

// 修改后
namespace app\domain\order\entity;
```

3. **更新引入**：
```php
// 修改前
use app\Domain\Order\Entity\Order;

// 修改后
use app\domain\order\entity\Order;
```

4. **清除自动加载缓存**：
```bash
composer dump-autoload
```

## 相关规则
- [namespace-directory-mismatch](namespace-directory-mismatch.md) - 命名空间必须匹配目录
- [interface-naming](interface-naming.md) - 接口命名规范
