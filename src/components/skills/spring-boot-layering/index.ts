import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { arthasCpuHighSkill } from "../arthas-cpu-high/index";
import { arthasSpringcontextIssuesResolveSkill } from "../arthas-springcontext-issues-resolve/index";
import { graalvmNativeImageSkill } from "../graalvm-native-image/index";
import { gradleBuildPerformanceSkill } from "../gradle-build-performance/index";
import { javaJunitSkill } from "../java-junit/index";

export const springBootLayeringSkill = defineSkill({
  id: "spring-boot-layering",
  fullName: "Spring Boot 分层模式",
  description: "当需要设计或审查 Spring Boot 3.x 分层（Controller/Service/Repository）、DTO 与 Entity 隔离、事务边界或 `@RestControllerAdvice` 异常处理时使用。",
  useCases: [
    "新建或重构 Java 21+ / Spring Boot 3.x 服务。",
    "审查 REST API、事务边界、JPA 映射、异常处理与可观测性。",
    "需要对接测试、原生镜像或构建优化时，联动：\n`java-junit`、\n`graalvm-native-image`、\n`gradle-build-performance`。",
    "诊断线上 JVM / Spring 运行时问题时，联动：\n`arthas-cpu-high`、\n`arthas-springcontext-issues-resolve`。",
  ],
  constraints: [
    "基线优先：默认使用 Java 21、Spring Boot 3.x、`jakarta.*` 命名空间。",
    "分层必须清晰：Controller 只做协议转换，Service 承担业务与事务，Repository 只做持久化。",
    "API 合同与持久化模型分离：不要把 JPA Entity 直接暴露为请求或响应。",
    "事务边界必须显式：读操作 `@Transactional(readOnly = true)`，写操作在服务层显式开启事务。",
    "错误处理统一出口：使用 `@RestControllerAdvice` 或等价机制，不要在 Controller 散落 `try/catch`。",
  ],
  checklist: [
    "输入 DTO 是否经过校验，返回 DTO 是否与 Entity 隔离。",
    "Controller 是否只处理 HTTP 语义，没有直接依赖 Repository。",
    "事务是否定义在 Service 层，且读写事务语义明确。",
    "JPA 查询是否考虑分页、N+1、索引命中与懒加载边界。",
    "异常是否经由统一处理层输出稳定错误码和消息。",
    "日志、指标、审计字段是否放在明确的可观测性边界，而不是业务代码里随手打印。",
  ],
  relatedSkills: [
    {
      get id() {
        return graalvmNativeImageSkill.id;
      },
      reason: "需要对接测试、原生镜像或构建优化时，联动： `java-junit`、 `graalvm-native-image`、 `gradle-build-performance`。",
    },
    {
      get id() {
        return gradleBuildPerformanceSkill.id;
      },
      reason: "需要对接测试、原生镜像或构建优化时，联动： `java-junit`、 `graalvm-native-image`、 `gradle-build-performance`。",
    },
    {
      get id() {
        return arthasCpuHighSkill.id;
      },
      reason: "诊断线上 JVM / Spring 运行时问题时，联动： `arthas-cpu-high`、 `arthas-springcontext-issues-resolve`。",
    },
    {
      get id() {
        return arthasSpringcontextIssuesResolveSkill.id;
      },
      reason: "诊断线上 JVM / Spring 运行时问题时，联动： `arthas-cpu-high`、 `arthas-springcontext-issues-resolve`。",
    },
    {
      get id() {
        return javaJunitSkill.id;
      },
      reason: "需要对接测试、原生镜像或构建优化时，联动：\\\\n`java-junit`、\\\\n`graalvm-native-image`、\\\\n`gradle-build-performance`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
