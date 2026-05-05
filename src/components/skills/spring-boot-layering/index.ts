import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const springBootLayeringSkill = defineSkill({
  id: "spring-boot-layering",
  fullName: "Spring Boot 分层模式",
  description: "当需要设计或审查 Spring Boot 3.x 分层（Controller/Service/Repository）、DTO 与 Entity 隔离、事务边界或 `@RestControllerAdvice` 异常处理时使用。",
  useCases: [
    "新建或重构 Java 21+ / Spring Boot 3.x 服务。",
    "审查 REST API、事务边界、JPA 映射、异常处理与可观测性。",
    "需要对接测试、原生镜像或构建优化时，联动：\n[java-junit](../java-junit/SKILL.md)、\n[graalvm-native-image](../graalvm-native-image/SKILL.md)、\n[gradle-build-performance](../gradle-build-performance/SKILL.md)。",
    "诊断线上 JVM / Spring 运行时问题时，联动：\n[arthas-cpu-high](../arthas-cpu-high/SKILL.md)、\n[arthas-springcontext-issues-resolve](../arthas-springcontext-issues-resolve/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
