---
name: php-design-patterns
description: 当用户要拆分 PHP 类职责、设计服务层与 Repository、构建 DTO/值对象、规范依赖注入或让控制器保持薄化时使用。
license: MIT
metadata:
  version: "1.0.0"
  domain: language
  triggers: PHP service layer, Repository, DTO, Value Object, dependency injection, controller, SOLID, 职责拆分, 分层, 解耦
  role: specialist
  scope: design
  output-format: code
  related-skills: php-pro, php-error-handling, php-type-safety, php-doc, php-testing
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

## 分层速查

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
- 联动：[php-pro](../php-pro/SKILL.md) · [php-error-handling](../php-error-handling/SKILL.md) · [php-doc](../php-doc/SKILL.md)

## 反模式

- 控制器里直接写业务流程、发通知、操作数据库。
- 用 `mixed` 和裸数组在层间传递数据。
- 依赖静态 Facade / 全局函数，测试难以隔离。
- 只有一种实现的接口却加工厂、策略、装饰器。
