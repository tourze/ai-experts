# 测试

## 功能测试

```php
class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_post(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->post('/api/posts', [
            'title' => 'Test Post',
            'content' => 'Test content.',
        ]);
        $response->assertStatus(201)->assertJsonPath('data.title', 'Test Post');
        $this->assertDatabaseHas('posts', ['title' => 'Test Post', 'user_id' => $user->id]);
    }

    public function test_guest_cannot_create_post(): void
    {
        $this->post('/api/posts', ['title' => 'X'])->assertStatus(401);
    }

    public function test_user_cannot_update_others_post(): void
    {
        $post = Post::factory()->create();
        $this->actingAs(User::factory()->create())
            ->put("/api/posts/{$post->id}", ['title' => 'Hack'])
            ->assertStatus(403);
    }
}
```

## Pest PHP

```php
uses(RefreshDatabase::class);

it('允许已认证用户创建文章', function () {
    $user = User::factory()->create();
    actingAs($user)->postJson('/api/posts', [
        'title' => 'Test', 'content' => 'Content',
    ])->assertCreated();
    expect(Post::count())->toBe(1);
});

it('验证标题长度', function (string $title, bool $pass) {
    $user = User::factory()->create();
    $r = actingAs($user)->postJson('/api/posts', ['title' => $title, 'content' => 'C']);
    $pass ? $r->assertCreated() : $r->assertJsonValidationErrors(['title']);
})->with([
    ['AB', false],
    ['ABC', true],
    [str_repeat('A', 256), false],
]);
```

## 工厂与状态

```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'slug' => fake()->slug(),
            'content' => fake()->paragraphs(3, true),
            'user_id' => User::factory(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['published_at' => now()]);
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['published_at' => null]);
    }
}

// 使用：带关联创建
$post = Post::factory()->has(Comment::factory()->count(3))->create();
```

## 模拟

```php
// HTTP
Http::fake(['api.example.com/*' => Http::response(['data' => []], 200)]);
Http::assertSent(fn ($r) => $r->hasHeader('Authorization'));

// 队列
Queue::fake();
Queue::assertPushed(ProcessPost::class, fn ($j) => $j->post->id === 1);

// 事件与通知
Event::fake([PostCreated::class]);
Event::assertDispatched(PostCreated::class);

Notification::fake();
Notification::assertSentTo($user, PostPublished::class);

// 存储
Storage::fake('public');
Storage::disk('public')->assertExists('file.jpg');
```

## 数据库断言

```php
$this->assertDatabaseHas('posts', ['title' => 'X']);
$this->assertDatabaseMissing('posts', ['id' => $id]);
$this->assertSoftDeleted('posts', ['id' => $id]);
$this->assertModelExists($post);
```

## 认证测试（Sanctum）

```php
Sanctum::actingAs($user, ['*']);
$this->getJson('/api/user')->assertOk()->assertJsonPath('data.id', $user->id);
```

## 运行命令

```bash
php artisan test                          # 全部测试
php artisan test --filter=PostTest        # 按名称筛选
php artisan test --parallel               # 并行执行
php artisan test --coverage --min=80      # 覆盖率检查
```

## 最佳实践

1. **RefreshDatabase** — 每次测试保持干净数据库
2. **工厂生成数据** — 不手动构造
3. **单一职责** — 每个测试只验证一个行为
4. **AAA 模式** — 准备、执行、断言
5. **模拟外部服务** — 不发真实请求
6. **覆盖率 >85%** — 覆盖关键路径
