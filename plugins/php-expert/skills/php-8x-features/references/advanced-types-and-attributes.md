# PHP 8.x 高级类型与属性示例

## 联合类型、交叉类型与 DNF 类型

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

## 一等公民可调用对象与箭头函数

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

## Never 返回类型

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

## PHP 8.x 属性（Attributes）

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
