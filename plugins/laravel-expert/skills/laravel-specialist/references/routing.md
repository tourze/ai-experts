# 路由与 API 资源

## 路由模式

```php
Route::resource('posts', PostController::class);           // 资源路由
Route::apiResource('posts', PostController::class);        // API 资源（无 create/edit）
Route::resource('posts', PostController::class)->only(['index', 'show']);

// 路由分组与中间件
Route::prefix('admin')->middleware('auth')->group(function () {
    Route::resource('users', UserController::class);
});

// 路由模型绑定
Route::get('/posts/{post:slug}', [PostController::class, 'show']);
```

## API 路由

```php
Route::prefix('v1')->group(function () {
    Route::get('/posts', [PostController::class, 'index']);           // 公开
    Route::middleware('auth:sanctum')->group(function () {            // 受保护
        Route::post('/posts', [PostController::class, 'store']);
        Route::put('/posts/{post}', [PostController::class, 'update']);
        Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    });
});
```

## 控制器

```php
class PostController extends Controller
{
    public function index()
    {
        return new PostCollection(Post::with('user')->published()->paginate(15));
    }

    public function store(StorePostRequest $request)
    {
        return new PostResource(Post::create($request->validated()));
    }

    public function show(Post $post)
    {
        return new PostResource($post->load(['user', 'comments.user']));
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $post->update($request->validated());
        return new PostResource($post);
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return response()->noContent();
    }
}
```

## 表单请求

```php
class StorePostRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:posts,slug'],
            'content' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
        ];
    }

    // 验证前预处理
    protected function prepareForValidation(): void
    {
        $this->merge(['slug' => str($this->title)->slug()]);
    }
}
```

## API 资源

```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->when($request->route()->named('posts.show'), $this->content),
            'published_at' => $this->published_at?->toISOString(),
            'author' => new UserResource($this->whenLoaded('user')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'links' => ['self' => route('api.posts.show', $this->id)],
        ];
    }
}
```

## 中间件

```php
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()?->isAdmin()) {
            abort(403, '未授权的操作。');
        }
        return $next($request);
    }
}
```

## 路由缓存与版本管理

```bash
php artisan route:cache    # 生成缓存
php artisan route:clear    # 清除缓存
php artisan route:list     # 列出所有路由
```

```php
// API 版本管理
Route::prefix('v1')->name('v1.')->group(fn () =>
    Route::apiResource('posts', V1\PostController::class));
Route::prefix('v2')->name('v2.')->group(fn () =>
    Route::apiResource('posts', V2\PostController::class));
```
