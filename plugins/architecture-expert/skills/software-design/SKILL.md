---
name: software-design
description: 当需要拆分职责、设计服务层、减少耦合、在组合与继承之间做选择，或从复杂度、深模块、信息隐藏角度评价设计时使用。语言无关的通用设计原则与架构模式。
---

# 软件设计

## 适用场景

- 新建 service、repository、adapter 等核心组件时需要先定边界。
- 现有类变成 God object，职责缠绕、难测、难改。
- 需要在继承、组合、接口、工具函数之间做取舍。
- 需要规划依赖注入策略和分层方向。
- 需要从复杂度、深模块、信息隐藏角度评价现有设计。
- 各语言落地：`go-design-patterns`、`python-design-patterns`、`php-design-patterns`。
- 具体重构配合 `refactoring-patterns`；重构计划配合 `refactor-planning-method`。

## 设计原则

以"是否降低整体复杂度"为最高标准，不追求局部优雅。

- **深模块**：强功能 + 简接口。模块的价值在于隐藏复杂度，不在转发调用。
- **信息隐藏**：把可能变化的知识封闭在模块内部，接口只暴露稳定抽象。
- **战略式编程**：为长期理解投资设计；战术式编程的累积会拖垮系统。
- **通用与专用分离**：通用模块不依赖专用模块。
- 原则展开见：[complexity-symptoms.md](references/complexity-symptoms.md)、[deep-modules.md](references/deep-modules.md)、[information-hiding.md](references/information-hiding.md)、[strategic-programming.md](references/strategic-programming.md)、[general-vs-special.md](references/general-vs-special.md)、[comments-as-design.md](references/comments-as-design.md)。

## 架构模式

- 单一职责优先于抽象优雅。
- 组合优先于继承；仅稳定 "is-a" 关系才继承。
- 抽象基于重复痛点，不预判未来需求。
- 业务逻辑、I/O、框架适配、序列化分属不同边界。
- 依赖单向：Controller/Handler → Service → Repository → Entity。
- 构造注入，避免静态单例与服务定位器。
- 控制器只做编排：验证 → 鉴权 → 调服务 → 映射响应。

### 分层速查

| 层 | 职责 | 禁止 |
|----|------|------|
| Controller/Handler | 验证、鉴权、调服务、映射响应 | 业务逻辑、直接操作数据库 |
| Service/UseCase | 业务流程编排、领域规则 | 访问 HTTP 请求、返回 HTTP 响应 |
| Repository | 数据访问、查询构建 | 业务规则 |
| DTO | 跨层数据传输、输入归一化 | 行为逻辑 |
| Value Object | 封装业务概念、自验证、不可变 | 可变状态 |

## 检查清单

- 一个类是否只有一个变化原因。
- I/O 能否被替身替换，让业务逻辑单测独立。
- 抽象是否真正减少了重复，而非增加跳转。
- 模块间只暴露最小接口，依赖无循环。
- 构造函数参数 ≤5，超过通常需拆分。
- 是否识别了变更放大、认知负担、未知未知数。
- 模块是深还是浅，知识有无泄漏。
- 注释记录的是设计意图和不变量，还是翻译代码。

## 反模式

详细示例见 [references/anti-patterns.md](references/anti-patterns.md)。核心信号：

- 浅模块：多层只转发不封装复杂度的类链。
- 继承滥用：为共享几行工具方法而继承。
- Fat Controller：控制器内直接写业务逻辑、发通知、记审计。
- 静态定位器：静态 Facade/Service Locator 导致无法测试。
- 配置地狱：18 个参数让调用方承担本应隐藏的复杂度。
