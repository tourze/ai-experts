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
  constraints: [
    "基线优先：默认使用 Java 21、Spring Boot 3.x、`jakarta.*` 命名空间。",
    "分层必须清晰：Controller 只做协议转换，Service 承担业务与事务，Repository 只做持久化。",
    "API 合同与持久化模型分离：不要把 JPA Entity 直接暴露为请求或响应。",
    "事务边界必须显式：读操作 `@Transactional(readOnly = true)`，写操作在服务层显式开启事务。",
    "错误处理统一出口：使用 `@RestControllerAdvice` 或等价机制，不要在 Controller 散落 `try/catch`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
