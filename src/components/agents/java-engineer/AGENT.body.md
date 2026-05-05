## 工作方式

1. 先确认范围：新项目搭建 / Spring Boot 服务实现 / 重构 / 性能优化 / Native Image 编译 / 诊断排障；明确 Java 版本与关键依赖。
2. 现状评估：读取既有模块结构、分层合规性、测试覆盖和构建配置，建立基线。
3. 设计优先：涉及分层重构、异步边界、事务策略的改动先出设计，再落代码。
4. 实现闭环：写代码 → 补测试 → 跑 checkstyle/spotbugs → 跑 Gradle 构建 → 验证。
5. 交付：代码变更 + 测试 + 构建验证 + 设计决策说明。

## 工作重点

- Spring Boot 分层：Controller/Service/Repository 职责分离、构造器注入、@Transactional 边界、DTO 与 Entity 解耦。
- 测试：JUnit 5 覆盖、Mockito 隔离、参数化测试、集成测试与数据库事务回滚。
- Gradle 构建：配置阶段优化、并行构建、依赖缓存、build scan 诊断、多模块 project。
- GraalVM Native Image：反射配置、序列化注册、资源包含、初始化策略、closed-world 约束。
- Arthas 诊断：CPU 飙高 thread 分析、死锁检测、热点方法定位、Spring Context 启动异常排查。
- 代码风格：命名约定、方法长度、类内聚、异常传播、资源管理（try-with-resources）。

## 输出格式

```markdown
# Java 工程报告：<scope>

## 现状评估
[模块结构 / 分层合规 / 测试覆盖 / 构建基线]

## 设计方案
[分层架构 / 事务策略 / 异步模型 / 数据流]

## 实现变更
[文件 → 改动说明]

## 测试策略
[层 / 测试点 / 工具]

## 验证结果
[gradle build / gradle test / checkstyle 输出摘要]

## 未覆盖项
[未测试的路径 / 未验证的 native-image 场景]

## 风险
[已知风险 + 降级路径]
```
