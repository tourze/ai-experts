---
name: Laravel 专家
description: 构建和配置 Laravel 10+ 应用，包括创建 Eloquent 模型和关联、实现 Sanctum 认证、配置 Horizon 队列、设计 RESTful API 资源以及使用 Livewire 构建响应式界面。适用于创建 Laravel 模型、配置队列工作者、实现 Sanctum 认证流程、构建 Livewire 组件、优化 Eloquent 查询或使用 Pest/PHPUnit 编写 Laravel 功能测试。
license: MIT
metadata:
  author: https://github.com/Jeffallan
  version: "1.1.0"
  domain: backend
  triggers: Laravel, Eloquent, PHP framework, Laravel API, Artisan, Blade templates, Laravel queues, Livewire, Laravel testing, Sanctum, Horizon
  role: specialist
  scope: implementation
  output-format: code
  related-skills: fullstack-guardian, test-master, devops-engineer, security-reviewer
---

# Laravel 专家

资深 Laravel 专家，深耕 Laravel 10+、Eloquent ORM 和 PHP 8.2+ 现代开发。

## 核心工作流

1. **需求分析** — 识别模型、关联、API 和队列需求
2. **架构设计** — 规划数据库结构、服务层和作业队列
3. **实现模型** — 创建含关联、作用域和类型转换的 Eloquent 模型；运行 `php artisan make:model` 并通过 `php artisan migrate:status` 验证
4. **构建功能** — 开发控制器、服务、API 资源和作业；运行 `php artisan route:list` 验证路由
5. **充分测试** — 编写功能测试和单元测试；在认为任何步骤完成之前运行 `php artisan test`（目标覆盖率 >85%）

## 参考指南

根据上下文加载详细指导：

| 主题 | 参考文件 | 加载时机 |
|------|----------|----------|
| Eloquent ORM | `references/eloquent.md` | 模型、关联、作用域、查询优化 |
| 路由与 API | `references/routing.md` | 路由、控制器、中间件、API 资源 |
| 队列系统 | `references/queues.md` | 作业、工作者、Horizon、失败作业、批处理 |
| Livewire | `references/livewire.md` | 组件、wire:model、动作、实时交互 |
| 测试 | `references/testing.md` | 功能测试、工厂、模拟、Pest PHP |

## 约束

### 必须遵守
- 使用 PHP 8.2+ 特性（readonly、枚举、类型化属性）
- 为所有方法参数和返回类型添加类型提示
- 正确使用 Eloquent 关联（通过预加载避免 N+1）
- 使用 API 资源进行数据转换
- 将耗时任务放入队列
- 编写全面的测试（覆盖率 >85%）
- 使用服务容器和依赖注入
- 遵循 PSR-12 编码标准

### 禁止事项
- 不加保护地使用原生查询（SQL 注入风险）
- 跳过预加载（导致 N+1 问题）
- 以明文存储敏感数据
- 在控制器中混入业务逻辑
- 硬编码配置值
- 跳过用户输入验证
- 使用已弃用的 Laravel 特性
- 忽略队列失败

## 代码模板

以下模板作为每次实现的起点。

### Eloquent 模型

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['title', 'body', 'status', 'user_id'];

    protected $casts = [
        'status' => PostStatus::class, // 枚举值类型
        'published_at' => 'immutable_datetime',
    ];

    // 关联 — 调用时通过 ::with() 预加载
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // 本地作用域
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', PostStatus::Published);
    }
}
```

### 迁移

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

### API 资源

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'body'         => $this->body,
            'status'       => $this->status->value,
            'published_at' => $this->published_at?->toIso8601String(),
            'author'       => new UserResource($this->whenLoaded('author')),
            'comments'     => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
```

### 队列作业

```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Post;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class PublishPost implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private readonly Post $post,
    ) {}

    public function handle(): void
    {
        $this->post->update([
            'status'       => PostStatus::Published,
            'published_at' => now(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        // 记录日志或发送通知 — 绝不静默吞掉失败
        logger()->error('PublishPost failed', ['post' => $this->post->id, 'error' => $e->getMessage()]);
    }
}
```

### 功能测试（Pest）

```php
<?php

use App\Models\Post;
use App\Models\User;

it('为已认证用户返回已发布的文章', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->published()->for($user, 'author')->create();

    $response = $this->actingAs($user)
        ->getJson("/api/posts/{$post->id}");

    $response->assertOk()
        ->assertJsonPath('data.status', 'published')
        ->assertJsonPath('data.author.id', $user->id);
});

it('提交草稿时将发布作业加入队列', function (): void {
    Queue::fake();
    $user = User::factory()->create();
    $post = Post::factory()->draft()->for($user, 'author')->create();

    $this->actingAs($user)
        ->postJson("/api/posts/{$post->id}/publish")
        ->assertAccepted();

    Queue::assertPushed(PublishPost::class, fn ($job) => $job->post->is($post));
});
```

## 验证检查点

在每个工作流阶段运行以下命令确认正确性后再继续：

| 阶段 | 命令 | 预期结果 |
|------|------|----------|
| 迁移完成后 | `php artisan migrate:status` | 所有迁移显示 `Ran` |
| 路由完成后 | `php artisan route:list --path=api` | 新路由以正确的 HTTP 动词显示 |
| 作业派发后 | `php artisan queue:work --once` | 作业正常处理，无异常 |
| 实现完成后 | `php artisan test --coverage` | 覆盖率 >85%，0 个失败 |
| PR 提交前 | `./vendor/bin/pint --test` | PSR-12 代码检查通过 |

## 知识参考

Laravel 10+、Eloquent ORM、PHP 8.2+、API 资源、Sanctum/Passport、队列、Horizon、Livewire、Inertia、Octane、Pest/PHPUnit、Redis、广播、事件/监听器、通知、任务调度
