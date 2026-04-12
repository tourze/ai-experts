# Laravel 模式

## 服务层模式

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CreateUserData;
use App\Models\User;
use App\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

final readonly class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private EmailService $emailService,
    ) {}

    public function createUser(CreateUserData $data): User
    {
        $user = $this->userRepository->create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => Hash::make($data->password),
        ]);
        $this->emailService->sendWelcomeEmail($user);
        return $user;
    }
}
```

## 仓库模式

```php
<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function findOrFail(int $id): User;
    public function findByEmail(string $email): ?User;
    public function create(array $data): User;
    public function update(int $id, array $data): User;
    public function delete(int $id): void;
    public function getActive(): Collection;
}
```

## 带枚举的表单请求

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

final class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)->mixedCase()->numbers()],
            'role' => ['required', new Enum(UserRole::class)],
        ];
    }

    public function toDto(): CreateUserData
    {
        return new CreateUserData(
            name: $this->validated('name'),
            email: $this->validated('email'),
            password: $this->validated('password'),
            role: UserRole::from($this->validated('role')),
        );
    }
}
```

## API 资源

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
final class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status->value,
            'created_at' => $this->created_at->toIso8601String(),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

## 队列任务

```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private readonly int $userId) {}

    public function handle(EmailService $emailService): void
    {
        $user = User::findOrFail($this->userId);
        $emailService->sendWelcomeEmail($user);
    }
}
```

## 快速参考

| 模式 | 用途 | 文件位置 |
|------|------|----------|
| Service | 业务逻辑 | `app/Services/` |
| Repository | 数据访问 | `app/Repositories/` |
| Form Request | 验证 | `app/Http/Requests/` |
| Resource | API 响应 | `app/Http/Resources/` |
| Job | 异步任务 | `app/Jobs/` |
| Event | 领域事件 | `app/Events/` |
| DTO | 数据传输 | `app/DTOs/` |
| Policy | 授权 | `app/Policies/` |
