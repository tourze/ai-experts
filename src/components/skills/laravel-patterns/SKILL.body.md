## 代码模式

**控制器 + Action + FormRequest：**
```php
final class PostController extends Controller
{
    public function __construct(private readonly CreatePostAction $createPost) {}
    public function store(StorePostRequest $request): JsonResponse
    {
        $this->authorize('create', Post::class);
        $post = $this->createPost->handle(actor: $request->user(), ...$request->safe()->only(['title', 'body']));
        return response()->json(['data' => PostResource::make($post->load('author'))], 201);
    }
}
```

**Model 规范（casts/enum/scope/relation）：**
```php
final class Post extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'body', 'status', 'author_id'];
    protected $casts = ['status' => PostStatus::class, 'published_at' => 'immutable_datetime'];
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'author_id'); }
    public function scopePublished(Builder $query): Builder { return $query->where('status', PostStatus::Published); }
}
```

**scopeBindings + Policy：**
```php
Route::middleware('auth:sanctum')->scopeBindings()->group(function (): void {
    Route::get('/accounts/{account}/projects/{project}', [ProjectController::class, 'show']);
});
// 控制器内：$this->authorize('view', [$project, $account]);
```

## 检查清单

- 每个 HTTP 入口能回答：控制器/FormRequest/Action/Resource 各负责什么。
- 嵌套资源启用 `scopeBindings()` 且 Policy 覆盖真正访问控制。
- 模型变更同步检查 `$fillable`、`$casts`、关系、策略和资源输出。
- 多表写操作在事务中，缓存失效绑定模型生命周期。
- N+1 已排查：列表/详情/嵌套资源都用了 `with()` 或 `load()`。
- 引入后台任务时同步检查幂等、重试、失败日志和 queue 配置。

## 反模式

### FAIL: 控制器同步编排副作用
```php
DB::transaction(function () use ($request) {
    $user = User::create($request->all());
    Mail::to($user)->send(new Welcome($user));  // 阻塞请求
    Stripe::charge($user, $request->amount);    // 外部 HTTP 同步
});
```

### PASS: Action + Job 异步
```php
final class UserController extends Controller
{
    public function store(StoreUserRequest $request, CreateUserAction $action): UserResource
    {
        $user = $action->handle($request->validated());
        SendWelcomeEmail::dispatch($user);
        return UserResource::make($user);
    }
}
```

### FAIL: N+1 懒加载
```php
PostResource::collection(Post::all()); // 每个 post 触发 author 查询
```

### FAIL: 缓存只加不失效
```php
$u = Cache::remember("user:$id", 3600, fn() => User::find($id)); // 无失效策略
```
