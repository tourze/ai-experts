import { defineRule, defineRuleBody, Platform } from "../../sdk";

export const javaCodingContractRule = defineRule({
  id: "java-coding-contract",
  title: "Java Coding Contract",
  description: "读写 Java 源码、JUnit 测试、Gradle 或 Maven 配置时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: defineRuleBody({
    lines: [
      "- Spring 分层默认保持 Controller 只做路由、参数校验和响应映射；Service 承载业务与事务边界，Repository 只做数据访问。",
      "- 依赖优先构造器注入，避免字段 `@Autowired` 和服务定位器；`@Transactional` 放在 Service 边界，不放 Controller。",
      "- 异常捕获具体类型；能处理就处理，不能处理就包装后抛出并保留根因，不用宽泛 catch 吞掉失败。",
      "- 单元测试能不用 Spring 容器就不用 `@SpringBootTest`；Web/Data/Spring 切片测试要说明范围和启动成本。",
      "- JUnit 5 测试按行为命名并使用 AAA 结构；参数化测试每组数据必须有业务含义，Mockito 只隔离协作者，不 mock 被测对象内部。",
      "- 异步测试不用固定 `Thread.sleep` 等待，使用 Awaitility 或显式同步信号；断言关键结果和参数内容，不只验证 `any()` 调用。",
      "- 改 Java 后优先跑项目已有 `./gradlew test` / `./gradlew check` / `mvn test` / `mvn verify`，并报告未验证项。",
    ],
  }),
  paths: [
    "**/*.java",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    "gradle.properties",
  ],
  priority: 20,
});
