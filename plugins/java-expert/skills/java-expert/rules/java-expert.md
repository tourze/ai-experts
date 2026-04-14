# java-expert Rules

## 目的

- 约束 `java-expert` skill 的输出风格、分层边界与验证顺序。
- 作为 [SKILL.md](../SKILL.md) 的简版导航，避免调用时丢失关键规范。

## 核心规则

- 优先遵循 Java 21 / Spring Boot 3.x / `jakarta.*` 基线。
- 控制器只处理协议层，服务层承载事务与业务规则，仓储层只负责持久化。
- 输出变更建议时，优先补测试与回归验证路径。

## 集成点

- 详细流程见 [SKILL.md](../SKILL.md)。
- 原生镜像问题转到 [graalvm-native-image](../../graalvm-native-image/SKILL.md)。
- 测试策略转到 [java-junit](../../java-junit/SKILL.md)。
