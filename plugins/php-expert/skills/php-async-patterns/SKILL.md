---
name: php-async-patterns
description: 当用户要在 PHP 中实现异步并发、使用 Swoole 协程/服务器、ReactPHP 事件循环、Amphp 或原生 Fibers 时使用。
---

# PHP 异步模式

## 适用场景

- 需要 PHP 长驻进程（HTTP 服务器、WebSocket、任务 worker）。
- 需要并发发起多个 HTTP / 数据库请求以降低总延迟。
- 在 Swoole、ReactPHP、Amphp 和原生 Fiber 之间做技术选型。
- 排查协程泄漏、通道阻塞或事件循环饥饿。

## 核心约束

- 协程内不要做阻塞 I/O（file_get_contents、sleep）——用异步替代。
- 协程间共享状态要用 Channel / Mutex，不要裸读写全局变量。
- 长驻进程必须处理内存泄漏：清 static 缓存、限 max_request、用弱引用。
- WebSocket / TCP 连接要有心跳和超时，不要假设连接永远存活。

## 代码模式

### 技术选型矩阵

| 特性 | Swoole | ReactPHP | Amphp | 原生 Fiber |
|------|--------|----------|-------|-----------|
| 协程模型 | 内置协程 | Promise | Fiber 驱动 | 手动调度 |
| HTTP 服务器 | 内置 | 通过包 | 通过包 | 无 |
| WebSocket | 内置 | 通过包 | 通过包 | 无 |
| 扩展要求 | 需要 C 扩展 | 不需要 | 不需要 | PHP 8.1+ |
| 学习曲线 | 中 | 低 | 中 | 高 |
| 适合 | 高性能服务器 | 事件驱动应用 | 现代异步框架 | 底层控制 |

### 参考实现

代码示例见 [patterns.md](references/patterns.md)。

## 检查清单

- 选定的异步方案与项目的部署约束匹配（Swoole 需 C 扩展）。
- 所有 I/O 都走异步客户端，无同步阻塞调用残留。
- 协程间通信通过 Channel 或消息，没有裸全局变量共享。
- 长驻进程有 max_request 或定期重启机制。
- 联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-error-handling](../php-error-handling/SKILL.md)

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

### FAIL: 协程裸读写

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
Co\go(function () use ($ch) {
    while ($item = $ch->pop()) { /* 顺序处理 */ }
});
```
