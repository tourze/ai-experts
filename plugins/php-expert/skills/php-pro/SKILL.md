---
name: php-pro
description: 当用户实现或重构现代 PHP 8.3+、Laravel、Symfony、Composer、PHPStan、PSR 工作流时使用。适用于搭建 DTO / 值对象 / 服务层 / 控制器 / API / 队列 / 测试，并在交付前用静态分析与测试收敛风险。
license: MIT
metadata:
  author: https://github.com/Jeffallan
  version: "1.1.0"
  domain: language
  triggers: PHP, Laravel, Symfony, Composer, PHPStan, PSR, PHP API, Eloquent, Doctrine
  role: specialist
  scope: implementation
  output-format: code
  related-skills: php-doc, phpunit-best-practices, laravel-specialist, symfony-ux
---

# PHP 工程实现

## 适用场景

- 使用 PHP 8.3+ 编写新功能、重构服务层或收敛弱类型边界。
- 构建 Laravel / Symfony 控制器、服务、DTO、值对象、仓库、任务队列与 API。
- 接手 Composer、PHPStan、Psalm、PHPUnit、Pest 驱动的质量门禁。
- 需要把“能跑”的 PHP 代码提升到“可维护、可分析、可验证”的工程形态。

## 核心约束

- 所有生产代码默认启用 `declare(strict_types=1)`。
- 方法参数、返回值、属性与集合元素都要有明确类型；无法收窄时优先定义 DTO、值对象或数组结构，而不是退回 `mixed`。
- 控制器只做编排：输入验证、鉴权、调用服务、映射响应；业务规则放到服务或领域对象。
- 依赖通过构造函数注入，避免隐藏的全局状态、静态单例与服务定位器。
- 用户输入必须在进入业务逻辑前完成验证、过滤和归一化。
- 数据访问默认使用参数化查询/ORM，禁止手拼 SQL 字符串。
- 交付前必须运行静态分析和测试；至少覆盖 `php -l`、`phpstan`/`psalm` 与 `phpunit`/`pest` 中适用的项。
- 根据任务上下文加载补充资料：
  - 现代语言特性：[modern-php-features.md](references/modern-php-features.md)
  - Laravel 模式：[laravel-patterns.md](references/laravel-patterns.md)
  - Symfony 模式：[symfony-patterns.md](references/symfony-patterns.md)
  - 异步与并发：[async-patterns.md](references/async-patterns.md)
  - 测试质量：[testing-quality.md](references/testing-quality.md)

## 代码模式

### 用只读 DTO 收紧输入边界

```php
<?php

declare(strict_types=1);

namespace App\DTO;

final readonly class CreateUserData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {
    }

    /**
     * @param array{name: string, email: string, password: string} $input
     */
    public static function fromArray(array $input): self
    {
        return new self(
            name: trim($input['name']),
            email: mb_strtolower(trim($input['email'])),
            password: $input['password'],
        );
    }
}
```

### 用服务层封装业务规则与仓储交互

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\CreateUserData;
use App\Entity\User;
use App\Repository\UserRepositoryInterface;
use RuntimeException;

final class UserCreator
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly PasswordHasherInterface $hasher,
    ) {
    }

    public function create(CreateUserData $data): User
    {
        if ($this->users->existsByEmail($data->email)) {
            throw new RuntimeException('Email already exists.');
        }

        $user = new User(
            name: $data->name,
            email: $data->email,
            passwordHash: $this->hasher->hash($data->password),
        );

        return $this->users->save($user);
    }
}
```

### 用 PHPUnit 锁住行为，而不是只断言“对象存在”

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\DTO\CreateUserData;
use App\Entity\User;
use App\Repository\UserRepositoryInterface;
use App\Service\PasswordHasherInterface;
use App\Service\UserCreator;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class UserCreatorTest extends TestCase
{
    private UserRepositoryInterface&MockObject $users;
    private PasswordHasherInterface&MockObject $hasher;
    private UserCreator $creator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->users = $this->createMock(UserRepositoryInterface::class);
        $this->hasher = $this->createMock(PasswordHasherInterface::class);
        $this->creator = new UserCreator($this->users, $this->hasher);
    }

    public function testCreateRejectsDuplicateEmail(): void
    {
        $this->users->method('existsByEmail')->with('alice@example.com')->willReturn(true);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Email already exists.');

        $this->creator->create(new CreateUserData('Alice', 'alice@example.com', 'secret'));
    }

    public function testCreateHashesPasswordBeforePersisting(): void
    {
        $data = new CreateUserData('Alice', 'alice@example.com', 'secret');

        $this->users->method('existsByEmail')->with('alice@example.com')->willReturn(false);
        $this->hasher->method('hash')->with('secret')->willReturn('hashed-secret');
        $this->users
            ->expects($this->once())
            ->method('save')
            ->with($this->callback(
                static fn (User $user): bool => $user->email === 'alice@example.com'
                    && $user->passwordHash === 'hashed-secret',
            ))
            ->willReturn(new User('Alice', 'alice@example.com', 'hashed-secret'));

        $result = $this->creator->create($data);

        $this->assertSame('alice@example.com', $result->email);
    }
}
```

## 检查清单

- 已确认当前任务属于哪一层：控制器、服务、领域对象、仓储、队列或测试。
- 所有输入边界都被收紧为显式类型、DTO、值对象或数组结构。
- 控制器没有吞入业务逻辑；副作用由服务层或消息处理器负责。
- 新增代码通过了适用的语法检查、静态分析与测试：
  - `php -l`
  - `./vendor/bin/phpstan analyse`
  - `./vendor/bin/psalm`
  - `./vendor/bin/phpunit` 或 `./vendor/bin/pest`
- 对外契约、数组结构和异常语义需要文档时，联动查看 [php-doc](../php-doc/SKILL.md)。
- 涉及测试命名、属性、数据提供者与配置约束时，联动查看 [phpunit-best-practices](../phpunit-best-practices/SKILL.md)。

## 反模式

- 用 `mixed`、裸数组和匿名对象把真实约束藏起来。
- 在控制器里直接写业务流程、发通知、做鉴权分支和数据库写入。
- 在生产代码里保留 `dd()`、`dump()`、`var_dump()` 或临时调试输出。
- 依赖静态 Facade/全局函数而没有显式边界，导致测试难以隔离。
- 只断言“返回了对象”，却没有锁住关键业务规则、异常和副作用。
- 静态分析或测试失败时仍然宣称“已经完成”。
