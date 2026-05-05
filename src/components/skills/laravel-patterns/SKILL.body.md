# Laravel 开发模式

原 `laravel-layering-patterns` 已合并入本 skill，架构与实现两层统一。

## 适用场景

- 设计或重构控制器、Action、Service、Query Object、API 资源和队列作业边界。
- 需要从需求直接落到 Artisan 命令、Eloquent 关系、FormRequest、JsonResource 或 Livewire 组件。
- 深入专题按需加载：`references/eloquent.md`、`routing.md`、`queues.md`、`livewire.md`、`testing.md`。
- 架构边界/安全/测试/发布检查切换到 `laravel-security`、`laravel-tdd`、`laravel-verification`。

## 核心约束

- 目标默认 Laravel 10+ / PHP 8.2+，使用严格类型、枚举、只读依赖和返回类型。
- 控制器只做授权、参数接收和响应封装；校验 → `FormRequest`，序列化 → `JsonResource`，业务逻辑 → Action/Service。
- 嵌套路由使用 `scopeBindings()`；路由绑定提升可预测性，但不能代替策略或 `authorize()`。
- 关系查询默认 `with()` / `load()`，不要把 N+1 留给调用方。
- 多表写操作放事务中；缓存命中必须成对设计失效策略（推荐模型事件绑定）。
- 耗时副作用默认入队，失败路径必须可观察。
- API 响应统一走 `JsonResource` / `ResourceCollection`，包含 `data`、`meta`、`error` 约定字段。
- 配置与密钥留在 `config/*` 和环境变量，禁止硬编码环境差异。

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
