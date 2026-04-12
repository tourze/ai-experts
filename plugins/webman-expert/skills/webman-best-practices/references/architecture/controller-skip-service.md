# Controller 跳过 Service 层

## 影响程度

**高** - 违反架构原则，导致代码难以测试和维护。

## 问题

Controller 直接依赖 Model（Eloquent ORM），完全跳过 Service 层。这导致业务逻辑放在 Controller 中，且无法脱离数据库进行测试。

## 为什么重要

- **紧耦合**：Controller 与数据库实现紧密耦合
- **不可测试**：无法脱离数据库对 Controller 进行单元测试
- **业务逻辑泄漏**：业务规则最终落在 Controller 中
- **违反 SRP**：Controller 同时处理 HTTP 和业务逻辑
- **难以重构**：更换数据源需要修改 Controller

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\controller\api\v1;

use app\model\eloquent\User;
use support\Request;
use support\Response;

final class UserController
{
    /**
     * 创建用户 - 错误：直接访问 Model
     */
    public function store(Request $request): Response
    {
        // 业务逻辑在 Controller 中
        $email = $request->post('email');

        // 直接查询数据库
        if (User::where('email', $email)->exists()) {
            return json(['error' => 'Email exists'], 400);
        }

        // 直接创建 Model
        $user = User::create([
            'name' => $request->post('name'),
            'email' => $email,
            'password' => password_hash($request->post('password'), PASSWORD_BCRYPT),
        ]);

        return json(['data' => $user], 201);
    }
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\controller\api\v1;

use app\service\user\CreateUserService;
use support\Request;
use support\Response;

final class UserController
{
    public function __construct(
        private readonly CreateUserService $createUserService
    ) {
    }

    /**
     * 创建用户 - 正确：委托给 Service
     */
    public function store(Request $request): Response
    {
        // Controller 仅处理 HTTP 相关事务
        $validated = $this->validate($request, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        // 业务逻辑在 Service 层
        $user = $this->createUserService->handle(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password']
        );

        return json(['data' => $user->toArray()], 201);
    }

    private function validate(Request $request, array $rules): array
    {
        // 简化的校验 - 生产环境使用正式的验证器
        return $request->all();
    }
}
```

**Service 层**：

```php
<?php

declare(strict_types=1);

namespace app\service\user;

use app\contract\repository\UserRepositoryInterface;
use app\domain\user\entity\User;
use app\domain\user\value_object\Email;

final class CreateUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(string $name, string $email, string $password): User
    {
        // 业务规则：检查邮箱唯一性
        if ($this->userRepository->existsByEmail($email)) {
            throw new \RuntimeException('Email already exists');
        }

        // 创建领域实体
        $user = User::create(
            name: $name,
            email: Email::fromString($email),
            password: $password
        );

        // 通过 Repository 持久化
        $this->userRepository->save($user);

        return $user;
    }
}
```

## 检测

**代码审查清单**：

- [ ] Controller 是否引入了任何 Model 类？
- [ ] Controller 是否调用了 `Model::create()`、`Model::find()` 等方法？
- [ ] Controller 是否包含业务逻辑（校验、计算）？
- [ ] Controller 能否脱离数据库进行单元测试？

**PHPStan 规则**（自定义）：

```php
// 检测 Controller 中的 Model 使用
if (class extends Controller && uses Model) {
    report("Controller should not directly depend on Model");
}
```

## 相关规则

- [service-direct-model-access](service-direct-model-access.md) - Service 应使用 Repository 而非 Model
- [constructor-injection](constructor-injection.md) - 如何正确注入依赖
