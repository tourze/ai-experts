# PHP 异步模式 — 代码示例

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
    'enable_coroutine' => true,
]);

$server->on('request', function (Request $request, Response $response) {
    $response->header('Content-Type', 'application/json');
    match ($request->server['request_uri']) {
        '/api/health' => $response->end(json_encode(['status' => 'healthy'])),
        default => $response->status(404)->end(json_encode(['error' => 'Not found'])),
    };
});

$server->start();
```

## Swoole 协程并发

```php
<?php

declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Coroutine\WaitGroup;

Coroutine\run(function () {
    $results = [];
    $wg = new WaitGroup();
    $urls = [
        'https://api.example.com/users',
        'https://api.example.com/posts',
    ];

    foreach ($urls as $url) {
        $wg->add();
        go(function () use ($url, &$results, $wg) {
            $client = new Coroutine\Http\Client(parse_url($url, PHP_URL_HOST), 443, true);
            $client->set(['timeout' => 5]);
            $client->get(parse_url($url, PHP_URL_PATH));
            $results[$url] = $client->statusCode;
            $client->close();
            $wg->done();
        });
    }
    $wg->wait();
});
```

## Swoole Channel 通信

```php
<?php

declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Coroutine\Channel;

Coroutine\run(function () {
    $channel = new Channel(10);

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
            if ($task === false && $channel->errCode === SWOOLE_CHANNEL_CLOSED) {
                break;
            }
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

## 原生 Fiber

```php
<?php

declare(strict_types=1);

$fiber = new Fiber(function (): string {
    $value = Fiber::suspend('fiber started');
    return "Received: {$value}";
});

$result1 = $fiber->start();       // 'fiber started'
$result2 = $fiber->resume('data'); // Fiber 返回 'Received: data'
```
