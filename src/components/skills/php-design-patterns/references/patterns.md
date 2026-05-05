# PHP 设计模式 — 代码示例

## 只读 DTO 收紧输入边界

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
    ) {}

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

## 服务层封装业务规则

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\CreateUserData;
use App\Entity\User;
use App\Repository\UserRepositoryInterface;

final readonly class UserCreator
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasherInterface $hasher,
    ) {}

    public function create(CreateUserData $data): User
    {
        if ($this->users->existsByEmail($data->email)) {
            throw new DuplicateEmailException($data->email);
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

## 接口定义仓库契约

```php
<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;

interface UserRepositoryInterface
{
    public function findOrFail(int $id): User;
    public function existsByEmail(string $email): bool;
    public function save(User $user): User;
    public function delete(User $user): void;
}
```

## 值对象封装业务概念

```php
<?php

declare(strict_types=1);

namespace App\Domain;

final readonly class Money
{
    public function __construct(
        public int $amountInCents,
        public string $currency,
    ) {
        if ($amountInCents < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative.');
        }
    }

    public function add(self $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch.');
        }
        return new self($this->amountInCents + $other->amountInCents, $this->currency);
    }
}
```

## 控制器只做编排

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\CreateUserData;
use App\Service\UserCreator;

final class CreateUserController
{
    public function __construct(
        private readonly UserCreator $userCreator,
    ) {}

    public function __invoke(CreateUserRequest $request): JsonResponse
    {
        $data = CreateUserData::fromArray($request->validated());
        $user = $this->userCreator->create($data);

        return new JsonResponse(
            UserResource::fromEntity($user),
            Response::HTTP_CREATED,
        );
    }
}
```
