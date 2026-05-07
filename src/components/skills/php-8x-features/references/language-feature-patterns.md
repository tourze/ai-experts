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

### 联合/交叉/DNF 类型、一等可调用对象、`never`、Attributes

详见 [references/advanced-types-and-attributes.md](references/advanced-types-and-attributes.md)。

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
