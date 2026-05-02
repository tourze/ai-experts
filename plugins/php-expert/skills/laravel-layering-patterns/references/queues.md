# 队列系统

## 作业模式

```php
class ProcessPost implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120;
    public $backoff = [60, 120, 300]; // 指数退避

    public function __construct(public Post $post) {}

    public function handle(): void
    {
        $this->post->update(['processed' => true]);
    }

    public function failed(\Throwable $e): void
    {
        \Log::error('ProcessPost failed', [
            'post_id' => $this->post->id,
            'error' => $e->getMessage(),
        ]);
    }
}
```

## 派发方式

```php
ProcessPost::dispatch($post);                          // 立即派发
ProcessPost::dispatch($post)->onQueue('processing');   // 指定队列
ProcessPost::dispatch($post)->delay(now()->addMinutes(10)); // 延迟
ProcessPost::dispatch($post)->afterCommit();           // 事务提交后
ProcessPost::dispatchIf($condition, $post);            // 条件派发
ProcessPost::dispatchSync($post);                      // 同步（不走队列）
```

## 作业链与批处理

```php
// 串联作业
Bus::chain([
    new ProcessPost($post),
    new NotifyUser($user),
])->catch(fn (\Throwable $e) => /* 处理失败 */)->dispatch();

// 批处理
Bus::batch([
    new ProcessPost($post1),
    new ProcessPost($post2),
])->then(fn (Batch $b) => /* 全部成功 */)
  ->catch(fn (Batch $b, \Throwable $e) => /* 首个失败 */)
  ->allowFailures()->dispatch();
```

## 速率限制与唯一作业

```php
// 速率限制中间件
public function middleware(): array
{
    return [new RateLimited('process-posts')];
}

// 防止重叠
public function middleware(): array
{
    return [(new WithoutOverlapping($this->user->id))->expireAfter(180)];
}

// 唯一作业
class ProcessPost implements ShouldQueue, ShouldBeUnique
{
    public int $uniqueFor = 3600;
    public function uniqueId(): string { return $this->post->id; }
}
```

## 队列工作者

```bash
php artisan queue:work                    # 启动工作者
php artisan queue:work --queue=high,default  # 指定队列
php artisan queue:work --once             # 处理单个作业
php artisan queue:restart                 # 优雅重启
php artisan queue:retry all               # 重试所有失败作业
```

## Horizon 配置要点

```php
// config/horizon.php — 生产环境示例
'supervisor-1' => [
    'connection' => 'redis',
    'queue' => ['default'],
    'balance' => 'auto',
    'maxProcesses' => 10,
    'tries' => 3,
    'timeout' => 60,
],
```

## 最佳实践

1. **作业幂等** — 可安全重复执行
2. **设置合理超时** — 防止挂起
3. **监控失败作业** — 配置告警
4. **使用 failed() 方法** — 正确处理错误
5. **耗时任务入队** — 不阻塞请求
