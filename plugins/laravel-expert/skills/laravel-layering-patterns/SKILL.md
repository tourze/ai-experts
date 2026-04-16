---
name: laravel-layering-patterns
description: 当需要实现 Laravel 10+ 的 Model/Migration、FormRequest 校验、JsonResource 序列化、Controller 瘦身、异步 Job 编排或 Livewire 组件时使用。
---

# Laravel 分层实现模式

## 适用场景

- 新增或修改 Laravel 10+ 的模型、迁移、控制器、请求、资源、作业和 Livewire 组件。
- 需要从需求直接落到 Artisan 命令、Eloquent 关系、API 输出和队列处理。
- 需要深入专题时，按需加载 [Eloquent 参考](./references/eloquent.md)、[路由与 API 参考](./references/routing.md)、[队列参考](./references/queues.md)、[Livewire 参考](./references/livewire.md)、[测试参考](./references/testing.md)。
- 需要额外的架构边界、安全基线、测试策略或发布检查时，切换到 [laravel-patterns](../laravel-patterns/SKILL.md)、[laravel-security](../laravel-security/SKILL.md)、[laravel-tdd](../laravel-tdd/SKILL.md)、[laravel-verification](../laravel-verification/SKILL.md)。

## 核心约束

- 目标默认是 Laravel 10+ 与 PHP 8.2+，实现时使用严格类型、枚举、只读依赖和返回类型。
- 控制器只做授权、参数接收和响应封装；校验放在 `FormRequest`，序列化放在 `JsonResource`。
- 关系查询默认考虑 `with()` / `load()`，不要把 N+1 留给调用方。
- 耗时副作用默认入队，失败路径必须可观察，不能静默吞错。
- 配置与密钥分别留在 `config/*` 与环境变量，禁止硬编码环境差异。

## 代码模式

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PostStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Post extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'body', 'status', 'author_id'];

    protected $casts = [
        'status' => PostStatus::class,
        'published_at' => 'immutable_datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', PostStatus::Published);
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;

final class PostController extends Controller
{
    public function store(StorePostRequest $request): JsonResponse
    {
        $post = Post::query()->create([
            ...$request->safe()->only(['title', 'body']),
            'author_id' => $request->user()->id,
            'status' => PostStatus::Draft,
        ]);

        return response()->json([
            'data' => PostResource::make($post->load('author')),
            'meta' => null,
            'error' => null,
        ], 201);
    }
}
```

## 检查清单

- 先确认需求落在哪个边界：模型/请求/资源/作业/Livewire，而不是把所有逻辑塞进控制器。
- 变更模型时同步检查 `$fillable`、`$casts`、关系方法、工厂、策略和资源输出。
- 变更 HTTP 入口时同步检查 `FormRequest`、路由绑定、中间件和 API 返回结构。
- 引入后台任务时同步检查幂等性、重试、失败日志和 `queue` 配置。
- 任何涉及数据库的实现都要补对应测试，至少覆盖成功路径、授权失败和验证失败。

## 反模式

### FAIL: Controller 同步编排副作用

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class UserController extends Controller
{
    public function store(Request $request): void
    {
        DB::transaction(function () use ($request) {
            $user = User::create($request->all());
            Mail::to($user)->send(new Welcome($user));  // 阻塞请求
            Stripe::charge($user, $request->amount);    // 外部 HTTP 同步
        });
    }
}
```

### PASS: Action + 异步

```php
<?php

final class UserController extends Controller
{
    public function store(StoreUserRequest $request, CreateUserAction $action): UserResource
    {
        $user = $action->handle($request->validated());
        SendWelcomeEmail::dispatch($user); // 异步

        return UserResource::make($user);
    }
}
```

### FAIL: N+1 懒加载

```php
<?php

use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

function listPosts(): AnonymousResourceCollection
{
    return PostResource::collection(Post::all()); // 每个 post 触发 author 查询
}
```

### PASS: 预加载

```php
<?php

use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

function listPosts(): AnonymousResourceCollection
{
    return PostResource::collection(Post::with('author')->get());
}
```
