## 技术选型矩阵

| 特性 | Swoole | ReactPHP | Amphp | 原生 Fiber |
|------|--------|----------|-------|-----------|
| 协程模型 | 内置协程 | Promise | Fiber 驱动 | 手动调度 |
| HTTP 服务器 | 内置 | 通过包 | 通过包 | 无 |
| WebSocket | 内置 | 通过包 | 通过包 | 无 |
| 扩展要求 | 需要 C 扩展 | 不需要 | 不需要 | PHP 8.1+ |
| 适合 | 高性能服务器 | 事件驱动应用 | 现代异步框架 | 底层控制 |

代码示例见 [patterns.md](references/patterns.md)。

## 代码模式

代码示例见 [patterns.md](references/patterns.md)。

## 检查清单

- 选定的异步方案与项目的部署约束匹配。
- 所有 I/O 都走异步客户端，无同步阻塞调用残留。
- 协程间通信通过 Channel 或消息，没有裸全局变量共享。
- 长驻进程有 max_request 或定期重启机制。

## 反模式

### FAIL: 协程内 sleep()

```php
Co\run(function () {
    Co\go(function () { sleep(3); });   // 阻塞整个事件循环
    Co\go(function () { /* 永远不执行 */ });
});
```

### PASS: Coroutine::sleep

```php
Co\run(function () {
    Co\go(function () { Co\System::sleep(3); });  // 让出协程
    Co\go(function () { echo "并发执行"; });
});
```

### FAIL: 协程裸读写共享变量

```php
$shared = [];
Co\go(function () use (&$shared) { $shared[] = 'a'; });
Co\go(function () use (&$shared) { $shared[] = 'b'; });
// 数据竞态
```

### PASS: Channel 通信

```php
$ch = new Co\Channel(10);
Co\go(function () use ($ch) { $ch->push('a'); });
Co\go(function () use ($ch) { $ch->push('b'); });
```
