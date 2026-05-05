## 代码模式

```php
<?php
// config/process.php
return ['heartbeat' => ['handler' => App\Process\Heartbeat::class, 'count' => 1]];
```

## 检查清单

- [ ] `config/process.php` 声明 `handler` 和 `count`
- [ ] 初始化在 `onWorkerStart`
- [ ] Timer ID 追踪并清理
- [ ] 回调无阻塞调用
- [ ] 长连接进程 `reloadable=>false`

## 反模式

### FAIL: 构造函数建连接

```php
class Heartbeat {
    public function __construct() {
        $this->db = new PDO('mysql:host=127.0.0.1;dbname=app', 'app', 'secret');  // master fork 前已建立
        $this->redis = new Redis();
    }
    public function onWorkerStart() { /* ... */ }
}
// fork 后所有 worker 共享同一连接 → 协议错乱 / mysql 报 "MySQL server has gone away"
```

### PASS: onWorkerStart 初始化

```php
class Heartbeat {
    private PDO $db;
    public function onWorkerStart() {
        $this->db = new PDO('mysql:host=127.0.0.1;dbname=app', 'app', 'secret');  // 每个 worker 独立连接
        $this->redis = new Redis();
    }
}
```

### FAIL: Timer 不清理

```php
class Heartbeat {
    public function onWorkerStart() {
        Timer::add(5, fn() => $this->ping());  // 创建后不存 ID
    }
}
// reload 时旧 timer 仍持有已销毁对象 → segfault
```

### PASS: 追踪 + onWorkerStop 清理

```php
class Heartbeat {
    private int $timerId = 0;

    public function onWorkerStart() {
        $this->timerId = Timer::add(5, fn() => $this->ping());
    }

    public function onWorkerStop() {
        if ($this->timerId) Timer::del($this->timerId);
    }
}
```

### FAIL: 回调 sleep

```php
Timer::add(1, function() {
    sleep(3);  // 阻塞整个事件循环 3 秒
    $this->process();
});
// 同 worker 上其他 timer / 连接全部冻结
```

### PASS: 异步等待

```php
Timer::add(1, function() {
    Workerman\Coroutine::sleep(3);  // 协程让出
    $this->process();
});
// 或拆成两个 Timer，各自 1 秒触发
```
