通用架构原则（分层、组合优于继承、构造注入、薄控制器）见 architecture-expert 的 software-design skill。

## 核心约束

- 控制器只做编排：验证 → 鉴权 → 调服务 → 映射响应。业务规则放到服务或领域对象。
- 依赖通过构造函数注入，避免静态 Facade 与服务定位器。
- 数据传输用 readonly DTO，不用裸数组跨层传递。
- 业务概念（金额、邮箱）考虑封装为值对象。

## 分层速查

| 层 | 职责 | 禁止 |
|----|------|------|
| Controller | 验证、鉴权、调服务、映射响应 | 业务逻辑、直接操作数据库 |
| Service | 业务流程编排、领域规则 | 访问 HTTP 请求、返回 HTTP 响应 |
| Repository | 数据访问、查询构建 | 业务规则 |
| DTO | 跨层数据传输、输入归一化 | 行为逻辑 |
| Value Object | 封装业务概念、自验证、不可变 | 可变状态 |

代码示例见 [patterns.md](references/patterns.md)。

联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-error-handling](../php-error-handling/SKILL.md) · [php-type-safety](../php-type-safety/SKILL.md)

## 代码模式

### 薄控制器 + Service

```php
public function __construct(private CreateUserService $service) {}
public function store(Request $r) {
    $dto = CreateUserDto::fromRequest($r->validated());
    $user = $this->service->execute($dto);
    return UserResource::make($user);
}
```

### 构造注入

```php
class OrderService {
    public function __construct(
        private CacheRepository $cache,
        private Mailer $mailer,
    ) {}
}
```

代码示例见 [patterns.md](references/patterns.md)。

## 检查清单

- 控制器没有吞入业务逻辑。
- 服务通过构造函数注入依赖，没有静态 Facade。
- 数据传输用 readonly DTO，不用裸数组跨层传递。
- 依赖方向单向：Controller → Service → Repository。

## 反模式

### FAIL: 控制器吞业务

```php
public function store(Request $r) {
    $u = User::create($r->all()); Mail::to($u)->send(...);
    Slack::notify(...); Auditor::log(...); return ['id' => $u->id];
}
// 200 行 fat controller
```

### PASS: 薄控制器 + Service

```php
public function __construct(private CreateUserService $service) {}
public function store(Request $r) {
    $dto = CreateUserDto::fromRequest($r->validated());
    $user = $this->service->execute($dto);
    return UserResource::make($user);
}
```

### FAIL: 静态 Facade

```php
class OrderService {
    public function place(...) { Cache::put(...); Mail::to(...); }
}
// 测试时无法 mock
```

### PASS: 构造注入

```php
class OrderService {
    public function __construct(
        private CacheRepository $cache,
        private Mailer $mailer,
    ) {}
    public function place(...) {
        $this->cache->put(...);
        $this->mailer->to(...);
    }
}
```
