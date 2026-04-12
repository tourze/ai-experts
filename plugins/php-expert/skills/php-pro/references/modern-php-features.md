# 现代 PHP 8.3+ 特性

## 严格类型与类型声明

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

function calculateTotal(int $price, float $taxRate): float
{
    return $price * (1 + $taxRate);
}

// 联合类型
function processId(int|string $id): string
{
    return is_int($id) ? (string)$id : $id;
}

// 交叉类型
interface Timestamped {}
interface Authenticatable {}

function handleUser(Timestamped&Authenticatable $user): void {}
```

## 带方法的枚举

```php
<?php

declare(strict_types=1);

enum UserStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case DELETED = 'deleted';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Active User',
            self::SUSPENDED => 'Suspended',
            self::DELETED => 'Deleted User',
        };
    }

    public function canLogin(): bool
    {
        return $this === self::ACTIVE;
    }

    public static function fromString(string $value): self
    {
        return self::from(strtolower($value));
    }
}

enum HttpStatus: int
{
    case OK = 200;
    case CREATED = 201;
    case BAD_REQUEST = 400;
    case UNAUTHORIZED = 401;
    case NOT_FOUND = 404;
    case SERVER_ERROR = 500;

    public function isSuccess(): bool
    {
        return $this->value >= 200 && $this->value < 300;
    }
}
```

## Readonly 属性与类

```php
<?php

declare(strict_types=1);

// Readonly 类（PHP 8.2+）
final readonly class Money
{
    public function __construct(
        public int $amount,
        public string $currency,
    ) {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative');
        }
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->amount + $other->amount, $this->currency);
    }
}

// 单独的 readonly 属性
class Configuration
{
    public function __construct(
        public readonly string $apiKey,
        public readonly string $apiSecret,
        private string $cache = '',
    ) {}
}
```

## 属性（元数据）

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

#[\Attribute(\Attribute::TARGET_PROPERTY)]
final readonly class Validate
{
    public function __construct(
        public ?string $rule = null,
        public ?int $min = null,
        public ?int $max = null,
    ) {}
}

// 使用属性
#[Route('/api/users', method: 'POST', middleware: ['auth'])]
final class CreateUserController
{
    public function __invoke(CreateUserRequest $request): JsonResponse
    {
        // ...
    }
}

class UserDto
{
    #[Validate(rule: 'email')]
    public string $email;

    #[Validate(min: 8, max: 100)]
    public string $password;
}
```

## 一等公民可调用对象

```php
<?php

declare(strict_types=1);

class UserService
{
    public function findById(int $id): ?User {}
    public function create(array $data): User {}
}

$service = new UserService();

// PHP 8.1+ 一等公民可调用对象语法
$finder = $service->findById(...);
$user = $finder(42);

// 数组操作
$numbers = [1, 2, 3, 4, 5];
$doubled = array_map(fn($n) => $n * 2, $numbers);

// 命名参数与可调用对象
$result = array_filter(
    array: $numbers,
    callback: fn($n) => $n % 2 === 0,
);
```

## Match 表达式

```php
<?php

declare(strict_types=1);

function getStatusColor(UserStatus $status): string
{
    return match ($status) {
        UserStatus::ACTIVE => 'green',
        UserStatus::SUSPENDED => 'yellow',
        UserStatus::DELETED => 'red',
    };
}

function calculateShipping(int $weight, string $zone): float
{
    return match (true) {
        $weight < 1000 => 5.00,
        $weight < 5000 && $zone === 'local' => 10.00,
        $weight < 5000 => 15.00,
        default => 25.00,
    };
}

// 多条件匹配
function getHttpMessage(int $code): string
{
    return match ($code) {
        200, 201, 204 => 'Success',
        400, 422 => 'Client Error',
        401, 403 => 'Unauthorized',
        500, 502, 503 => 'Server Error',
        default => 'Unknown',
    };
}
```

## 纤程（PHP 8.1+）

```php
<?php

declare(strict_types=1);

// 基本纤程示例
$fiber = new \Fiber(function (): void {
    $value = \Fiber::suspend('fiber started');
    echo "Received: {$value}\n";
    \Fiber::suspend('second suspend');
    echo "Fiber completed\n";
});

$result1 = $fiber->start();
echo "First result: {$result1}\n";

$result2 = $fiber->resume('data from main');
echo "Second result: {$result2}\n";

$fiber->resume('final data');

// 使用纤程实现异步风格
function async(callable $callback): \Fiber
{
    return new \Fiber($callback);
}

function await(\Fiber $fiber): mixed
{
    if (!$fiber->isStarted()) {
        return $fiber->start();
    }
    return $fiber->resume();
}
```

## Never 类型

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

class NotFoundException extends \Exception
{
    public static function throw(string $resource): never
    {
        throw new self("Resource not found: {$resource}");
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
