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
