## 适用场景

- 新增登录、API 令牌、策略、上传接口、Webhook 或任何处理用户输入的 Laravel 端点。
- 需要为 Laravel 应用补齐认证授权、验证、速率限制和部署安全设置。
- 发布前检查安全配置、签名链接、CORS 与日志脱敏是否到位。
- 需要实现层面的配套测试时参考 [laravel-tdd](../laravel-tdd/SKILL.md)；需要发布前全量自检时参考 [laravel-verification](../laravel-verification/SKILL.md)。

## 核心约束

- 认证不等于授权：`auth:sanctum` 保护入口，`Policy` / `authorize()` 决定资源权限。
- 用户输入默认不可信，所有写入口先经 `FormRequest`，禁止把派生字段从请求直接灌进模型。
- 批量赋值必须显式控制；敏感文件默认落到非公开磁盘，并校验 MIME、大小和扩展名。
- 对登录、重置密码、OTP、导出等高风险入口设置独立限流，不共享宽松阈值。
- `APP_DEBUG=false`、密钥轮换、日志脱敏和 HTTPS 代理配置属于基线，而不是可选项。

## 代码模式

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

final class UploadInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('upload', Invoice::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'invoice' => ['required', 'file', 'mimetypes:application/pdf', 'max:5120'],
        ];
    }
}
```

```php
<?php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('login', function (Request $request): array {
    return [
        Limit::perMinute(5)->by((string) $request->ip()),
        Limit::perMinute(5)->by(strtolower((string) $request->input('email'))),
    ];
});
```

## 检查清单

- 每个受保护路由都同时检查“谁能进来”和“谁能操作这个资源”。
- 文件上传是否验证 MIME、大小、目标磁盘和后续扫描流程。
- 模型是否显式声明 `$fillable` 或 `$guarded`，避免 `Model::unguard()` 渗透全局。
- 登录、重置密码、OTP、导出、Webhook 是否有独立速率限制和审计日志。
- `APP_DEBUG`、`APP_KEY`、HTTPS 代理、Cookie 标志位、CORS 和安全头是否在目标环境真实生效。

## 反模式

### FAIL: 只认证不鉴权

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->put('/posts/{post}', [PostController::class, 'update']);

final class PostController extends Controller
{
    // 控制器里没 authorize() → 任何登录用户都能改别人的文章
    public function update(Request $request, Post $post): void
    {
        $post->update($request->all());
    }
}
```

### PASS: Policy + FormRequest

```php
<?php

final class PostController extends Controller
{
    public function update(UpdatePostRequest $request, Post $post): void
    {
        $this->authorize('update', $post); // 只有 owner/admin
        $post->update($request->safe()->only(['title', 'body']));
    }
}
```

### FAIL: 批量赋值全开

```php
Post::create($request->all()); // 客户端传 is_admin、author_id 都能写入
```

### PASS: 显式白名单

```php
Post::create([
    ...$request->safe()->only(['title', 'body']),
    'author_id' => $request->user()->id, // 服务端强制赋值
]);
```

- 把上传文件放在公开目录，再指望前端不猜路径。
- 记录明文 token、密码、完整邮箱或卡号到日志。
- 线上依赖 `APP_DEBUG=true`。
