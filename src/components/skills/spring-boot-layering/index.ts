import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "需要建立 Controller、Service、Repository、DTO、Entity 和异常处理的清晰边界。",
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
      reason: "Spring Boot 服务需要原生镜像、RuntimeHints 或 Native Image 配置时联动。",
    },
    {
      get id() {
        return gradleBuildPerformanceSkill.id;
      },
      reason: "构建变慢、Gradle 配置或 CI 构建性能影响服务交付时联动。",
    },
    {
      get id() {
        return arthasCpuHighSkill.id;
      },
      reason: "线上 JVM CPU 飙高、线程热点或负载异常需要运行时诊断时联动。",
    },
    {
      get id() {
        return arthasSpringcontextIssuesResolveSkill.id;
      },
      reason: "线上 Bean、ApplicationContext、条件装配或配置注入异常需要运行时诊断时联动。",
    },
    {
      get id() {
        return javaJunitSkill.id;
      },
      reason: "需要为 Controller、Service、Repository 或异常处理补单元/集成测试时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Entity 直接当 API 响应",
      pass: "DTO 隔离",
    }),
    defineAntiPattern({
      fail: "Controller 直接访问 Repository",
      pass: "业务逻辑收归 Service",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 Java 21、Spring Boot 3.x 和 jakarta.* 基线，以及 API、持久化、事务和错误处理范围。",
      "Controller 只处理 HTTP 协议转换和校验，不直接依赖 Repository；输入输出使用 DTO，不暴露 Entity。",
      "Service 承担业务逻辑与事务边界：读操作 readOnly，写操作显式 @Transactional。",
      "Repository 只做持久化；JPA 查询检查分页、N+1、索引命中、懒加载和事务边界。",
      "异常统一经 @RestControllerAdvice 或等价机制输出稳定错误码和消息，日志/指标/审计放在明确可观测性边界。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "分层设计或审查结论：Controller、Service、Repository、DTO、Entity、事务和异常出口。",
      "JPA 查询、分页、N+1、索引、懒加载、日志/指标/审计边界风险。",
      "需要 java-junit、GraalVM、Gradle 或 Arthas 运行时诊断联动的具体触发点。",
    ],
  }),
  references: [
    defineReference({
      id: "layering-rules",
      source: new URL("./references/layering-rules.md", import.meta.url),
      target: "references/layering-rules.md",
      title: "Spring Boot Layering Rules",
      summary: "Spring Boot 分层边界、输出风格、验证顺序和相关 skill 路由。",
      loadWhen: "需要快速复核 Spring Boot 分层审查规则或相关 skill 路由时读取。",
    }),
    defineReference({
      id: "implementation-template",
      source: new URL("./references/implementation-template.md", import.meta.url),
      target: "references/implementation-template.md",
      title: "Spring Boot Implementation Template",
      summary: "Spring Boot 分层实现的目标、TDD 顺序和验证清单模板。",
      loadWhen: "需要输出 Spring Boot 分层实现计划或变更模板时读取。",
    }),
  ],
});
