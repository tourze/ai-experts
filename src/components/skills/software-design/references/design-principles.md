## 设计原则

以"是否降低整体复杂度"为最高标准，不追求局部优雅。

- **深模块**：强功能 + 简接口。模块的价值在于隐藏复杂度，不在转发调用。
- **信息隐藏**：把可能变化的知识封闭在模块内部，接口只暴露稳定抽象。
- **战略式编程**：为长期理解投资设计；战术式编程的累积会拖垮系统。
- **通用与专用分离**：通用模块不依赖专用模块。
- 原则展开见：[complexity-symptoms.md](./complexity-symptoms.md)、[deep-modules.md](./deep-modules.md)、[information-hiding.md](./information-hiding.md)、[strategic-programming.md](./strategic-programming.md)、[general-vs-special.md](./general-vs-special.md)、[comments-as-design.md](./comments-as-design.md)。

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
