# PHP 类型安全 — 代码示例与配置

## PHPStan 推荐配置

```neon
# phpstan.neon
parameters:
    level: 9
    paths: [src, tests]
    excludePaths: [src/bootstrap.php, vendor]
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon
```

## Psalm 推荐配置

```xml
<!-- psalm.xml -->
<?xml version="1.0"?>
<psalm errorLevel="1" resolveFromConfigFile="true"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="https://getpsalm.org/schema/config vendor/vimeo/psalm/config.xsd">
    <projectFiles>
        <directory name="src" />
        <ignoreFiles><directory name="vendor" /></ignoreFiles>
    </projectFiles>
</psalm>
```

## Array Shapes

```php
<?php

declare(strict_types=1);

/**
 * @param array{
 *     id: int,
 *     name: string,
 *     email: string,
 *     tags?: list<string>,
 * } $userData
 */
function processUser(array $userData): void
{
    // PHPStan 知道 $userData['id'] 是 int，$userData['tags'] 是 ?list<string>
}

/**
 * @return array{total: int, items: list<array{id: int, title: string}>}
 */
function fetchPage(int $page): array
{
    return [
        'total' => 100,
        'items' => [['id' => 1, 'title' => 'First']],
    ];
}
```

## 泛型集合

```php
<?php

declare(strict_types=1);

/**
 * @template T
 */
final class TypedCollection
{
    /** @var list<T> */
    private array $items = [];

    /**
     * @param T $item
     */
    public function add(mixed $item): void
    {
        $this->items[] = $item;
    }

    /**
     * @return list<T>
     */
    public function all(): array
    {
        return $this->items;
    }

    /**
     * @template U
     * @param callable(T): U $callback
     * @return TypedCollection<U>
     */
    public function map(callable $callback): self
    {
        $new = new self();
        foreach ($this->items as $item) {
            $new->add($callback($item));
        }
        return $new;
    }
}
```

## 条件返回类型

```php
<?php

declare(strict_types=1);

final readonly class UserRepository
{
    /**
     * @return ($orFail is true ? User : User|null)
     */
    public function findByEmail(string $email, bool $orFail = false): ?User
    {
        $user = $this->doFind($email);
        if ($user === null && $orFail) {
            throw new UserNotFoundException($email);
        }
        return $user;
    }
}
```

## 类型收窄与断言

```php
<?php

declare(strict_types=1);

final class TypeGuard
{
    /**
     * @phpstan-assert User $value
     */
    public static function assertUser(mixed $value): void
    {
        if (!$value instanceof User) {
            throw new \InvalidArgumentException('Expected User instance.');
        }
    }

    /**
     * @phpstan-assert non-empty-string $value
     */
    public static function assertNonEmptyString(mixed $value): void
    {
        if (!is_string($value) || $value === '') {
            throw new \InvalidArgumentException('Expected non-empty string.');
        }
    }
}

// 使用：调用后 PHPStan 知道 $input 是 User
TypeGuard::assertUser($input);
$input->email; // 不再报错
```

## 消除 @var 强转

```php
<?php

declare(strict_types=1);

// ❌ 强转——如果缓存值类型变了，bug 被隐藏
/** @var User $user */
$user = $cache->get('user:42');

// ✅ 运行时断言——类型不匹配时立即报错
$user = $cache->get('user:42');
assert($user instanceof User);
```
