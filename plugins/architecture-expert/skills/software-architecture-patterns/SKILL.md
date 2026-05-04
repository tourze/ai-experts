---
name: software-architecture-patterns
description: 当需要拆分职责、设计服务层、减少耦合、在组合与继承之间做选择，或重构组件结构时使用。语言无关的通用架构模式。
---

# 软件架构模式

## 适用场景

- 新建 service、repository、adapter 等核心组件时需要先定边界。
- 现有类已经变成 God object，职责缠绕、难测、难改。
- 需要在继承、组合、接口/协议、工具函数之间做取舍。
- 需要规划依赖注入策略和分层方向。
- 各语言落地时加载对应语言 skill：[go-design-patterns](../../go-expert/skills/go-design-patterns/SKILL.md)、[python-design-patterns](../../python-expert/skills/python-design-patterns/SKILL.md)、[php-design-patterns](../../php-expert/skills/php-design-patterns/SKILL.md)。

## 核心约束

- 先满足单一职责，再谈抽象优雅。
- 组合优先于继承；只有存在稳定"is-a"关系时才继承。
- 抽象要基于重复痛点，不要为了"以后可能会用到"提前造层。
- 业务逻辑、I/O、框架适配、序列化分别放在不同边界。
- 依赖方向必须单向清晰：Controller/Handler → Service → Repository → Entity，禁止低层反向 import 高层。
- 依赖通过构造函数注入，避免静态单例与服务定位器。
- 控制器/Handler 只做编排：验证 → 鉴权 → 调服务 → 映射响应。

## 分层速查

| 层 | 职责 | 禁止 |
|----|------|------|
| Controller/Handler | 验证、鉴权、调服务、映射响应 | 业务逻辑、直接操作数据库 |
| Service/UseCase | 业务流程编排、领域规则 | 访问 HTTP 请求、返回 HTTP 响应 |
| Repository | 数据访问、查询构建 | 业务规则 |
| DTO | 跨层数据传输、输入归一化 | 行为逻辑 |
| Value Object | 封装业务概念、自验证、不可变 | 可变状态 |

## 检查清单

- 一个类是否只有一个主要变化原因。
- I/O 能否被替身替换，从而让业务逻辑单测独立运行。
- 抽象层是否真正减少了重复，而不是引入更多跳转。
- 模块之间是否只暴露最小接口。
- 依赖方向是否单向，没有循环引用。
- 构造函数参数是否可控（超过 5 个依赖通常意味着需要拆分）。

## 反模式

### FAIL: 继承叠基类复用几行

```python
class BaseRepo:
    def _log(self, msg): print(msg)
class UserRepo(BaseRepo): ...
class OrderRepo(BaseRepo): ...
# 为了共享 _log 一个方法，所有仓储全部继承
```

### PASS: 组合注入

```python
class Logger(Protocol):
    def log(self, msg: str) -> None: ...
class UserRepo:
    def __init__(self, logger: Logger) -> None: self._logger = logger
```

### FAIL: 控制器吞业务

```php
public function store(Request $r) {
    $u = User::create($r->all()); Mail::to($u)->send(...);
    Slack::notify(...); Auditor::log(...); return ['id' => $u->id];
}
// 200 行 fat controller
```

### PASS: 薄控制器 + Service

控制器只做验证 → 鉴权 → 调服务 → 映射响应。Service 内部组合 Repository + 通知 + 审计。

### FAIL: 静态 Facade / Service Locator

```php
class OrderService {
    public function place(...) { Cache::put(...); Mail::to(...); }
}
// 测试时无法 mock
```

### PASS: 构造注入

所有外部依赖通过构造函数传入，测试时注入 mock 即可。
