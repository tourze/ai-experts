# Eloquent ORM

## 模型模式

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'published_at',
        'user_id',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'metadata' => 'array',
        'is_featured' => 'boolean',
    ];

    // 使用新的 Attribute 语法定义访问器（Laravel 9+）
    protected function title(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower($value),
        );
    }

    // 计算属性的修改器
    protected function excerpt(): Attribute
    {
        return Attribute::make(
            get: fn () => str($this->content)->limit(100),
        );
    }
}
```

## 关联

```php
// 一对多
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function latestPost(): HasOne
    {
        return $this->hasOne(Post::class)->latestOfMany();
    }

    public function oldestPost(): HasOne
    {
        return $this->hasOne(Post::class)->oldestOfMany();
    }
}

class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // 反向关联
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}

// 多对多（含中间表）
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('expires_at', 'assigned_by')
            ->withTimestamps()
            ->using(RoleUser::class); // 自定义中间表模型
    }
}

// 远程一对多
class Country extends Model
{
    public function posts(): HasManyThrough
    {
        return $this->hasManyThrough(Post::class, User::class);
    }
}

// 多态关联
class Image extends Model
{
    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}

// 多对多多态关联
class Tag extends Model
{
    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    public function videos(): MorphToMany
    {
        return $this->morphedByMany(Video::class, 'taggable');
    }
}
```

## 查询作用域

```php
class Post extends Model
{
    // 本地作用域
    public function scopePublished($query): void
    {
        $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopePopular($query, int $threshold = 100): void
    {
        $query->where('views', '>=', $threshold);
    }

    // 全局作用域
    protected static function booted(): void
    {
        static::addGlobalScope('active', function ($query) {
            $query->where('status', 'active');
        });
    }
}

// 使用方式
$posts = Post::published()->popular(500)->get();

// 自定义作用域类
namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AncientScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('created_at', '<', now()->subYears(10));
    }
}

// 在模型中应用
protected static function booted(): void
{
    static::addGlobalScope(new AncientScope);
}
```

## 自定义类型转换

```php
namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class Money implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): float
    {
        return $value / 100; // 数据库存储分，返回元
    }

    public function set($model, string $key, $value, array $attributes): int
    {
        return (int) ($value * 100);
    }
}

// 在模型中使用
protected $casts = [
    'price' => Money::class,
];
```

## 查询优化

```php
// 预加载（防止 N+1）
$posts = Post::with(['user', 'comments.user'])->get();

// 懒预加载
$posts = Post::all();
$posts->load('user');

// 带约束的预加载
$users = User::with(['posts' => function ($query) {
    $query->where('published', true)->orderBy('created_at', 'desc');
}])->get();

// 高效统计关联数量
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;
}

// 存在性检查
$users = User::withExists('posts')->get();

// 分块处理大数据集
Post::chunk(100, function ($posts) {
    foreach ($posts as $post) {
        // 处理文章
    }
});

// 延迟集合，节省内存
Post::lazy()->each(function ($post) {
    // 逐条处理
});
```

## 模型事件

```php
class Post extends Model
{
    protected static function booted(): void
    {
        static::creating(function ($post) {
            $post->slug = str($post->title)->slug();
        });

        static::updating(function ($post) {
            if ($post->isDirty('title')) {
                $post->slug = str($post->title)->slug();
            }
        });

        static::deleted(function ($post) {
            $post->images()->delete();
        });
    }
}

// 使用观察者
namespace App\Observers;

class PostObserver
{
    public function creating(Post $post): void
    {
        $post->user_id = auth()->id();
    }

    public function updated(Post $post): void
    {
        cache()->forget("post.{$post->id}");
    }
}

// 在 AppServiceProvider 中注册
use App\Models\Post;
use App\Observers\PostObserver;

public function boot(): void
{
    Post::observe(PostObserver::class);
}
```

## 高级查询

```php
// 子查询
$users = User::select(['id', 'name'])
    ->addSelect(['latest_post_title' => Post::select('title')
        ->whereColumn('user_id', 'users.id')
        ->latest()
        ->limit(1)
    ])->get();

// 条件查询
$posts = Post::query()
    ->when($search, fn ($query) => $query->where('title', 'like', "%{$search}%"))
    ->when($category, fn ($query) => $query->where('category_id', $category))
    ->get();

// 数据库事务
DB::transaction(function () {
    $user = User::create([...]);
    $user->profile()->create([...]);
    $user->assignRole('member');
});

// 悲观锁
$user = User::where('id', 1)->lockForUpdate()->first();

// 更新或插入
User::upsert(
    [
        ['email' => 'john@example.com', 'name' => 'John'],
        ['email' => 'jane@example.com', 'name' => 'Jane'],
    ],
    ['email'], // 唯一列
    ['name']   // 需要更新的列
);
```

## 性能建议

1. **始终预加载关联** — 避免 N+1 查询
2. **对大数据集使用分块处理** — 防止内存溢出
3. **为外键添加索引** — 加速关联查询
4. **使用 select() 限制返回列** — 减少数据传输
5. **缓存昂贵查询** — 使用 Redis/Memcached
6. **使用数据库索引** — 在迁移中添加索引
7. **避免在模型事件中执行重操作** — 改用队列
8. **使用延迟集合** — 处理大数据集时节省内存
