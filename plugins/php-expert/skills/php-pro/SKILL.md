---
name: php-pro
description: 当用户实现或重构 PHP 8.3+ 类、函数或模块，需要用到 strict_types、readonly class、枚举、match 表达式、命名参数、构造器提升或交叉类型时使用。
license: MIT
metadata:
  author: https://github.com/Jeffallan
  version: "2.0.0"
  domain: language
  triggers: PHP 8.3, strict_types, readonly, enum, match, named arguments, constructor promotion, intersection types, never type, fibers, first-class callable
  role: specialist
  scope: implementation
  output-format: code
  related-skills: php-design-patterns, php-error-handling, php-type-safety, php-async-patterns, php-doc, php-testing
---

# PHP 8.3+ 语言特性与核心纪律

## 适用场景

- 新建 PHP 类、函数或模块，需要选择合适的 PHP 8.x 语言特性。
- 把遗留 PHP 5/7 代码升级到 PHP 8.1-8.3+ 的现代写法。
- 在 readonly class、枚举、match、交叉类型之间做取舍。
- 需要快速查阅某个 PHP 8.x 特性的正确用法。

## 核心约束

- 所有生产代码默认启用 `declare(strict_types=1)`。
- 方法参数、返回值、属性都要有明确类型；无法收窄时优先定义 DTO 或值对象，不要退回 `mixed`。
- 优先使用 `readonly` 属性和 `readonly class` 来表达不可变数据。
- 枚举替代 class 常量组和魔法字符串；有底层值时用 backed enum。
- `match` 替代多分支 `switch`；利用其穷尽性检查和严格比较。
- 构造器提升（constructor promotion）简化属性声明，减少样板代码。
- 命名参数只在调用点提升可读性时使用，不要滥用到每个函数调用。

## 代码模式

### Readonly class 与构造器提升

```php
<?php

declare(strict_types=1);

namespace App\Domain\User;

final readonly class User
{
    public function __construct(
        public int $id,
        public string $email,
        public UserStatus $status,
        public \DateTimeImmutable $createdAt,
    ) {}
}
```

### 带方法的枚举

```php
<?php

declare(strict_types=1);

namespace App\Domain\User;

enum UserStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Deleted = 'deleted';

    public function label(): string
    {
        return match ($this) {
            self::Active => '活跃',
            self::Suspended => '已暂停',
            self::Deleted => '已删除',
        };
    }

    public function canLogin(): bool
    {
        return $this === self::Active;
    }
}
```

### Match 表达式替代 switch

```php
<?php

declare(strict_types=1);

function calculateShipping(int $weightGrams, string $zone): float
{
    return match (true) {
        $weightGrams < 1000 => 5.00,
        $weightGrams < 5000 && $zone === 'local' => 10.00,
        $weightGrams < 5000 => 15.00,
        default => 25.00,
    };
}
```

### 联合类型、交叉类型与 DNF 类型

```php
<?php

declare(strict_types=1);

// 联合类型
function processId(int|string $id): string
{
    return is_int($id) ? (string) $id : $id;
}

// 交叉类型
interface Timestamped {}
interface Authenticatable {}

function handleUser(Timestamped&Authenticatable $user): void {}

// DNF 类型（PHP 8.2+）
function process((Timestamped&Authenticatable)|null $user): void {}
```

### 一等公民可调用对象与箭头函数

```php
<?php

declare(strict_types=1);

class UserService
{
    public function findById(int $id): ?User { /* ... */ }
}

$service = new UserService();

// PHP 8.1+ 一等公民可调用对象
$finder = $service->findById(...);

// 箭头函数
$numbers = [1, 2, 3, 4, 5];
$even = array_filter($numbers, fn(int $n): bool => $n % 2 === 0);
```

### Never 返回类型

```php
<?php

declare(strict_types=1);

function redirect(string $url): never
{
    header("Location: {$url}");
    exit;
}

function abort(int $code, string $message): never
{
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}
```

### PHP 8.x 属性（Attributes）

```php
<?php

declare(strict_types=1);

#[\Attribute(\Attribute::TARGET_CLASS)]
final readonly class Route
{
    public function __construct(
        public string $path,
        public string $method = 'GET',
        public array $middleware = [],
    ) {}
}

#[Route('/api/users', method: 'POST', middleware: ['auth'])]
final class CreateUserController
{
    public function __invoke(CreateUserRequest $request): JsonResponse
    {
        // ...
    }
}
```

## 快速参考

| 特性 | PHP 版本 | 用法 |
|------|----------|------|
| Readonly 属性 | 8.1+ | `public readonly string $name` |
| Readonly 类 | 8.2+ | `readonly class User {}` |
| 枚举 | 8.1+ | `enum Status: string {}` |
| 一等公民可调用对象 | 8.1+ | `$fn = $obj->method(...)` |
| Never 类型 | 8.1+ | `function exit(): never` |
| 纤程 | 8.1+ | `new \Fiber(fn() => ...)` |
| 纯交叉类型 | 8.1+ | `A&B $param` |
| DNF 类型 | 8.2+ | `(A&B)\|C $param` |
| Trait 中的常量 | 8.2+ | `trait T { const X = 1; }` |
| 动态常量获取 | 8.3+ | `$enum::{$name}` |
| `#[\Override]` | 8.3+ | 标记方法为覆写，父类签名变更时编译报错 |

## 检查清单

- `declare(strict_types=1)` 出现在每个 PHP 文件顶部。
- 所有参数、返回值和属性都有显式类型声明。
- 常量组已迁移为枚举，魔法字符串已消除。
- 多分支 `switch` 已替换为 `match`。
- 不可变数据使用了 `readonly class` 或 `readonly` 属性。
- 需要设计服务层、DTO、Repository 时，联动查看 [php-design-patterns](../php-design-patterns/SKILL.md)。
- 需要设计异常层级或输入校验时，联动查看 [php-error-handling](../php-error-handling/SKILL.md)。
- 需要配置 PHPStan/Psalm 或补泛型标注时，联动查看 [php-type-safety](../php-type-safety/SKILL.md)。

## 反模式

- 在 PHP 8.1+ 项目中仍用 class 常量组代替枚举。
- 用 `switch` 写 5+ 分支而不迁移到 `match`。
- 数据传输对象不加 `readonly`，留下意外修改的风险。
- 用 `mixed` 逃避类型声明，而不是定义 DTO 或联合类型。
- 在生产代码里保留 `dd()`、`dump()`、`var_dump()` 或 `print_r()`。
