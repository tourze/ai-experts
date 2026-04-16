---
name: php-design-patterns
description: 当用户要拆分 PHP 类职责、设计服务层与 Repository、构建 DTO/值对象、规范依赖注入或让控制器保持薄化时使用。
---

# PHP 设计模式与分层

## 适用场景

- 新建 service、repository、DTO、值对象等核心组件时需要先定边界。
- 现有类已经变成 God class，业务逻辑散落在控制器和模型里。
- 需要把依赖注入从"到处 `new`"收敛为构造函数注入。

## 核心约束

- 一个类只做一件事（单一职责）。组合优先于继承。
- 控制器只做编排：验证 → 鉴权 → 调服务 → 映射响应。业务规则放到服务或领域对象。
- 依赖通过构造函数注入，避免静态单例与服务定位器。
- 依赖方向单向：Controller → Service → Repository → Entity。
- 抽象要基于重复痛点，不要为"以后可能用到"提前造层。

## 代码模式

### 分层速查

| 层 | 职责 | 禁止 |
|----|------|------|
| Controller | 验证、鉴权、调服务、映射响应 | 业务逻辑、直接操作数据库 |
| Service | 业务流程编排、领域规则 | 访问 HTTP 请求、返回 HTTP 响应 |
| Repository | 数据访问、查询构建 | 业务规则 |
| DTO | 跨层数据传输、输入归一化 | 行为逻辑 |
| Value Object | 封装业务概念、自验证、不可变 | 可变状态 |

代码示例见 [patterns.md](references/patterns.md)。

## 检查清单

- 控制器没有吞入业务逻辑。
- 服务通过构造函数注入依赖，没有 `new` 外部依赖。
- 数据传输用 readonly DTO，不用裸数组跨层传递。
- 业务概念（金额、邮箱）考虑封装为值对象。
- 联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-error-handling](../php-error-handling/SKILL.md) · [php-doc](../php-doc/SKILL.md)

## 反模式

### FAIL: 控制器吞业务

```php
public function store(Request $r) {
    $u = User::create($r->all());  // 直接 DB
    Mail::to($u)->send(new Welcome($u));  // 发邮件
    Slack::notify("new user");  // 通知
    Auditor::log('user.create', $u);  // 审计
    return ['id' => $u->id];
}
// 200 行的 fat controller
```

### PASS: 薄控制器 + Service

```php
public function __construct(private CreateUserService $service) {}

public function store(Request $r) {
    $dto = CreateUserDto::fromRequest($r->validated());
    $user = $this->service->execute($dto);
    return UserResource::make($user);
}
// CreateUserService 内部组合 Repository + Mailer + Auditor
```

### FAIL: 静态 Facade

```php
class OrderService {
    public function place(...) {
        Cache::put(...);  // 静态 Facade
        Mail::to(...);    // 测试时无法 mock
    }
}
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
// 测试时注入 mock 即可
```
