# 异步 PHP 模式

## Swoole HTTP 服务器

```php
<?php

declare(strict_types=1);

use Swoole\HTTP\Server;
use Swoole\HTTP\Request;
use Swoole\HTTP\Response;

$server = new Server('0.0.0.0', 9501);

$server->set([
    'worker_num' => 4,
    'max_request' => 10000,
    'task_worker_num' => 2,
    'enable_coroutine' => true,
]);

$server->on('request', function (Request $request, Response $response) {
    $response->header('Content-Type', 'application/json');
    match ($request->server['request_uri']) {
        '/api/users' => handleUsers($request, $response),
        '/api/health' => $response->end(json_encode(['status' => 'healthy'])),
        default => $response->status(404)->end(json_encode(['error' => 'Not found'])),
    };
});

$server->start();
```

## Swoole 协程

```php
<?php

declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Coroutine\Http\Client;

// 并发 HTTP 请求
Coroutine\run(function () {
    $results = [];
    $wg = new Coroutine\WaitGroup();
    $urls = [
        'https://api.example.com/users',
        'https://api.example.com/posts',
    ];

    foreach ($urls as $url) {
        $wg->add();
        go(function () use ($url, &$results, $wg) {
            $client = new Client(parse_url($url, PHP_URL_HOST), 443, true);
            $client->set(['timeout' => 5]);
            $client->get(parse_url($url, PHP_URL_PATH));
            $results[$url] = ['status' => $client->statusCode, 'body' => $client->body];
            $client->close();
            $wg->done();
        });
    }
    $wg->wait();
});
```

## Swoole Channel（通信）

```php
<?php

declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Coroutine\Channel;

Coroutine\run(function () {
    $channel = new Channel(10); // 缓冲区大小：10

    // 生产者
    go(function () use ($channel) {
        for ($i = 1; $i <= 5; $i++) {
            $channel->push("Task {$i}");
            Coroutine::sleep(0.5);
        }
        $channel->close();
    });

    // 消费者
    go(function () use ($channel) {
        while (true) {
            $task = $channel->pop();
            if ($task === false && $channel->errCode === SWOOLE_CHANNEL_CLOSED) { break; }
            echo "Consumed: {$task}\n";
        }
    });
});
```

## ReactPHP 事件循环

```php
<?php

declare(strict_types=1);

require 'vendor/autoload.php';

use React\Http\Message\Response;
use Psr\Http\Message\ServerRequestInterface;

$server = new React\Http\HttpServer(function (ServerRequestInterface $request) {
    return new Response(200, ['Content-Type' => 'application/json'],
        json_encode(['method' => $request->getMethod(), 'uri' => (string) $request->getUri()])
    );
});

$socket = new React\Socket\SocketServer('0.0.0.0:8080');
$server->listen($socket);
```

## PHP 纤程（原生 PHP 8.1+）

```php
<?php

declare(strict_types=1);

// 使用纤程实现简单异步函数
function async(callable $callback): Fiber
{
    return new Fiber($callback);
}

function await(Fiber $fiber): mixed
{
    if (!$fiber->isStarted()) { return $fiber->start(); }
    if ($fiber->isTerminated()) { return $fiber->getReturn(); }
    return $fiber->resume();
}
```

## 快速参考

| 技术 | 适用场景 | 性能 |
|------|----------|------|
| Swoole | 高性能服务器、WebSocket | 非常高 |
| ReactPHP | 事件驱动应用、实时场景 | 高 |
| Amphp | 现代异步框架 | 高 |
| 纤程 | 原生异步（PHP 8.1+） | 中等 |

| 特性 | Swoole | ReactPHP | Amphp |
|------|--------|----------|-------|
| 协程 | 是 | 否（Promise） | 是（纤程） |
| HTTP 服务器 | 内置 | 通过包 | 通过包 |
| WebSocket | 内置 | 通过包 | 通过包 |
| 扩展要求 | 需要 | 不需要 | 不需要 |
| 学习曲线 | 中等 | 低 | 中等 |
