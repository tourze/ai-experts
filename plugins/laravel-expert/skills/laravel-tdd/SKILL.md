---
name: laravel-tdd
description: 当用户提到 Laravel 测试、Pest、PHPUnit、RefreshDatabase、Queue::fake 或 HTTP fake 时使用。
---

# Laravel TDD 工作流

## 适用场景

- Laravel 新功能、Bug 修复、重构、授权规则或副作用链路需要先写测试再实现。
- 需要测试 HTTP 端点、Eloquent 模型、策略、队列作业、通知和 Sanctum 认证。
- 需要把回归范围从“手点一下”提升到可重复执行的自动化验证。
- 发布前整体验证看 [laravel-verification](../laravel-verification/SKILL.md)，实现边界约束看 [laravel-patterns](../laravel-patterns/SKILL.md)。

## 核心约束

- 保持红绿重构循环：先写失败测试，再做最小实现，再清理结构。
- 优先用 Pest 写新测试；只有项目已有 PHPUnit 约定或需要特定基类时才回退 PHPUnit。
- 触库测试默认 `RefreshDatabase`；外部副作用默认 `Queue::fake()`、`Event::fake()`、`Http::fake()`。
- 一个测试只验证一个行为边界：成功、授权失败、验证失败、外部依赖失败分开覆盖。
- 覆盖率只是结果，不是借口；关键路径没有断言细节时，80% 也可能毫无意义。

## 代码模式

```php
<?php

use App\Jobs\PublishPost;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('发布文章时会将作业加入队列', function (): void {
    Queue::fake();
    $user = User::factory()->create();
    $post = Post::factory()->draft()->for($user, 'author')->create();

    Sanctum::actingAs($user);

    $this->postJson("/api/posts/{$post->id}/publish")
        ->assertAccepted();

    Queue::assertPushed(PublishPost::class);
});
```

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Posts\NormalizeSlug;
use PHPUnit\Framework\TestCase;

final class NormalizeSlugTest extends TestCase
{
    public function test_it_normalizes_basic_titles(): void
    {
        $action = new NormalizeSlug();

        self::assertSame('hello-laravel', $action->handle('Hello Laravel'));
    }
}
```

## 检查清单

- 新增入口前先定义成功路径，再补授权失败和验证失败。
- 触及数据库时确认是否需要工厂状态、软删除断言、资源断言或 JSON 结构断言。
- 引入队列、事件、通知、HTTP 客户端时，先决定 fake 的边界和需要断言的副作用。
- 测试名称直接描述业务行为，不写 `test_1` 或“should work”。
- 合并前至少能回答：哪些行为被测试锁住了，哪些风险仍靠人工验证。

## 反模式

- 先把功能写完，再“顺手补两个 happy path 测试”。
- 一个测试同时断言多个行为，失败后完全不知道哪条约束坏了。
- 真实调用外部 HTTP、队列、邮件、存储，导致测试不稳定。
- 为了让测试通过而绕开授权、中间件或验证逻辑。
- 只看覆盖率数字，不检查断言是否真正保护了业务约束。
