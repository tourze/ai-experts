# 设计反模式详解

## 浅模块 vs 深模块

### FAIL: 浅模块伪装架构

```ts
class UserController {
  constructor(private service: UserService) {}
  getUser(id) { return this.service.getUser(id); }
}
class UserService {
  constructor(private repo: UserRepo) {}
  getUser(id) { return this.repo.findById(id); }
}
class UserRepo {
  findById(id) { return db.users.find({id}); }
}
// 三层都只是转发，没有任何复杂度被隐藏
```

### PASS: 深模块

```ts
class OrderService {
  async place(req: PlaceOrderRequest): Promise<Order> {
    // 内部隐藏：库存校验 / 价格计算 / 优惠 / 支付路由 / 通知 / 审计
  }
}
// 接口窄，内部复杂度高 → 真正降低系统总复杂度
```

## 继承滥用 vs 组合

### FAIL: 继承叠基类复用几行

```python
class BaseRepo:
    def _log(self, msg): print(msg)
class UserRepo(BaseRepo): ...
class OrderRepo(BaseRepo): ...
```

### PASS: 组合注入

```python
class Logger(Protocol):
    def log(self, msg: str) -> None: ...
class UserRepo:
    def __init__(self, logger: Logger) -> None: self._logger = logger
```

## Fat Controller vs Thin Controller

### FAIL: 控制器吞业务

```php
public function store(Request $r) {
    $u = User::create($r->all()); Mail::to($u)->send(...);
    Slack::notify(...); Auditor::log(...); return ['id' => $u->id];
}
```

### PASS: 薄控制器 + Service

控制器只做验证 → 鉴权 → 调服务 → 映射响应。Service 内部组合 Repository + 通知 + 审计。

## 静态定位器 vs 构造注入

### FAIL: 静态 Facade / Service Locator

```php
class OrderService {
    public function place(...) { Cache::put(...); Mail::to(...); }
}
```

### PASS: 构造注入

所有外部依赖通过构造函数传入，测试时注入 mock 即可。

## 配置参数地狱 vs 合理默认

### FAIL: 配置参数地狱

```ts
process(items, {
  parallel: true, retries: 3, timeout: 5000,
  cache: true, cacheKey: 'x', cacheTTL: 60,
  logger: customLogger, errorHandler: ...,
});
```

### PASS: 合理默认 + 进阶 API

```ts
process(items)                            // 90% 场景
process(items, { parallel: true })        // 9% 场景
processAdvanced(items, fullOpts)          // 1% 高级场景
```
