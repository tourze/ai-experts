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

### FAIL: 真实调用外部服务

```php
it('sends welcome email', function () {
    $user = User::factory()->create();
    (new SendWelcome($user))->handle(); // 真的发了邮件给真实地址
    expect(Mail::class)->toExist(); // 无意义断言
});
```

### PASS: Fake + 断言副作用

```php
it('queues welcome email', function () {
    Mail::fake();
    $user = User::factory()->create();
    (new SendWelcome($user))->handle();
    Mail::assertQueued(Welcome::class, fn($mail) => $mail->hasTo($user->email));
});
```

### FAIL: 一个测试断言多个行为

```php
it('works', function () {
    $response = $this->post('/users', $data);
    $response->assertCreated();
    expect(User::count())->toBe(1);
    Mail::assertSent(Welcome::class);
    Queue::assertPushed(SyncUserJob::class);
    // 失败了不知道哪条约束坏了
});
```

### PASS: 一个测试一个行为

```php
<?php

it('returns 201 on create', fn() => $this->postJson('/users', ['name' => 'Ada'])->assertCreated());

it('persists the user', function (): void {
    $this->postJson('/users', ['name' => 'Ada'])->assertCreated();
    expect(User::count())->toBe(1);
});

it('queues sync job', function (): void {
    Queue::fake();
    $this->postJson('/users', ['name' => 'Ada'])->assertCreated();
    Queue::assertPushed(SyncUserJob::class);
});
```
