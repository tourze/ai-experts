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
