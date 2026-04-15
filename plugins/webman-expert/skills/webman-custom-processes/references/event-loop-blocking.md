# 事件循环阻塞：回调中禁止同步等待

## 影响程度

**严重**

## 问题

在 `onWorkerStart`、`onMessage`、`Timer` 回调中调用 `sleep()`、同步 HTTP 请求或阻塞文件 I/O，导致整个 Worker 进程冻结，所有连接和定时器全部停摆。

## 为什么重要

- Workerman 每个 Worker 进程运行单线程事件循环。事件循环被阻塞期间，该 Worker 无法处理任何新连接、消息或定时器回调。
- 一个 `sleep(5)` 会让 Worker 内所有连接的心跳检测、消息接收、超时处理全部暂停 5 秒。
- 同步 HTTP 请求（`file_get_contents('http://...')`、同步 cURL）在网络超时时可能阻塞 30 秒以上。
- 多个客户端共享同一个 Worker 进程，一个阻塞操作影响所有客户端。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Timer;
use Workerman\Worker;

final class BlockingProcess
{
    public function onWorkerStart(Worker $worker): void
    {
        Timer::add(5.0, function (): void {
            // 同步 HTTP 请求阻塞事件循环
            $result = file_get_contents('http://api.example.com/check');

            // sleep 阻塞事件循环
            sleep(2);

            $this->process($result);
        });
    }

    private function process(string $data): void
    {
    }
}
```

## 正确示例

使用 Workerman 的异步 HTTP 客户端：

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Http\Client as HttpClient;
use Workerman\Timer;
use Workerman\Worker;

final class NonBlockingProcess
{
    private ?HttpClient $httpClient = null;

    public function onWorkerStart(Worker $worker): void
    {
        $this->httpClient = new HttpClient();

        Timer::add(5.0, function (): void {
            $this->httpClient->get(
                'http://api.example.com/check',
                function ($response): void {
                    $this->process((string) $response->getBody());
                },
                function ($exception): void {
                    Worker::log('HTTP request failed: ' . $exception->getMessage());
                }
            );
        });
    }

    private function process(string $data): void
    {
    }
}
```

使用异步队列解耦阻塞操作：

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Webman\RedisQueue\Client;
use Workerman\Connection\TcpConnection;

final class MessageHandler
{
    public function onMessage(TcpConnection $connection, mixed $data): void
    {
        // 将耗时操作推入异步队列，不阻塞事件循环
        Client::send('process-message', [
            'socket_id' => $connection->socketId ?? '',
            'payload'   => (string) $data,
        ]);

        $connection->send('{"status":"queued"}');
    }
}
```

## 常见阻塞源

| 阻塞调用 | 替代方案 |
|----------|---------|
| `sleep()` / `usleep()` | `Timer::add($delay, $callback, [], false)` |
| `file_get_contents('http://...')` | `Workerman\Http\Client` 异步请求 |
| 同步 cURL | `Workerman\Http\Client` 或 Guzzle Promise |
| 同步数据库查询（大量数据） | 异步队列 + Consumer |
| `flock()` 长时间等待 | 非阻塞 `flock(LOCK_NB)` + 重试 Timer |

## 检测

**代码审查清单**

- [ ] `onMessage`、`onConnect`、Timer 回调中是否有 `sleep()`？
- [ ] 是否有 `file_get_contents('http://...')`、同步 `curl_exec()`？
- [ ] 数据库批量查询是否在事件回调中直接执行？
- [ ] 文件锁 `flock()` 是否使用了 `LOCK_NB` 非阻塞模式？

## 相关规则

- [timer-management](timer-management.md) — 用 Timer 替代 sleep
- [process-lifecycle](process-lifecycle.md) — onWorkerStart 中的初始化也不可阻塞
- [crash-recovery](crash-recovery.md) — 阻塞导致的假死与进程恢复
