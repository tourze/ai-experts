---
name: laravel-patterns
description: 当用户提到 Laravel 分层、Service/Action 边界、scopeBindings、多租户路由、N+1 或 API 资源设计时使用。
---

# Laravel 开发模式

## 适用场景

- 设计或重构控制器、动作、服务、查询对象和 API 资源边界。
- 需要在父子资源路由、多租户隔离、事务和缓存之间建立稳定约束。
- 需要把“能跑”的实现提升为“可维护”的 Laravel 代码组织方式。
- 具体落地实现看 [laravel-layering-patterns](../laravel-layering-patterns/SKILL.md)，安全边界看 [laravel-security](../laravel-security/SKILL.md)，测试回归看 [laravel-tdd](../laravel-tdd/SKILL.md)。

## 核心约束

- 控制器只负责授权、输入整形、调用动作或服务、返回资源；业务规则不落在控制器或 Blade 中。
- 嵌套路由默认使用 `scopeBindings()`；路由绑定提升可预测性，但不能代替策略或 `authorize()`。
- 多表写操作默认放在事务中；缓存命中必须成对设计失效策略。
- 复杂筛选使用 Eloquent 作用域、查询对象或专用 action，避免把 SQL 拼接散落在多个入口。
- API 响应统一走 `JsonResource` / `ResourceCollection`，不要混用随意结构。

## 代码模式

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Projects\CreateProjectAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

final class ProjectController extends Controller
{
    public function __construct(private readonly CreateProjectAction $createProject) {}

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = $this->createProject->handle(
            actor: $request->user(),
            name: (string) $request->validated('name'),
        );

        return response()->json([
            'data' => ProjectResource::make($project),
            'meta' => null,
            'error' => null,
        ], 201);
    }
}
```

```php
<?php

use App\Http\Controllers\Api\AccountProjectController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')
    ->scopeBindings()
    ->group(function (): void {
        Route::get('/accounts/{account}/projects/{project}', [AccountProjectController::class, 'show'])
            ->name('accounts.projects.show');
    });
```

## 检查清单

- 每个 HTTP 入口都能回答“控制器负责什么、动作负责什么、模型负责什么”。
- 嵌套资源是否启用了 `scopeBindings()`，并且策略依旧覆盖真正的访问控制。
- 所有多写操作是否包进事务，失败后是否留下半成功状态。
- 缓存键、缓存标签和失效时机是否跟模型生命周期绑定，而不是靠人工记忆。
- API 返回是否统一包含 `data`、`meta`、`error` 等约定字段，避免客户端分支爆炸。

## 反模式

### FAIL: 嵌套路由只绑定不授权

```php
Route::get('/accounts/{account}/projects/{project}', function (Account $account, Project $project) {
    return $project; // 只要知道 URL，任何人都能读任何账户的项目
});
```

### PASS: scopeBindings + Policy

```php
<?php

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->scopeBindings()->group(function (): void {
    Route::get('/accounts/{account}/projects/{project}', [ProjectController::class, 'show']);
});

final class ProjectController extends Controller
{
    public function show(Account $account, Project $project): ProjectResource
    {
        $this->authorize('view', [$project, $account]); // 真正的访问控制

        return ProjectResource::make($project);
    }
}
```

### FAIL: 缓存只加不失效

```php
$user = Cache::remember("user:$id", 3600, fn() => User::find($id));
// 用户改了邮箱，但缓存还是旧值 1 小时
```

### PASS: 模型事件绑定失效

```php
User::updated(fn($user) => Cache::forget("user:{$user->id}"));
```
