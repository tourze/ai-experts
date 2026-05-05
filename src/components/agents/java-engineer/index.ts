import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { springBootLayeringSkill } from "../../skills/spring-boot-layering/index";
import { javaJunitSkill } from "../../skills/java-junit/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { gradleBuildPerformanceSkill } from "../../skills/gradle-build-performance/index";
import { graalvmNativeImageSkill } from "../../skills/graalvm-native-image/index";
import { arthasCpuHighSkill } from "../../skills/arthas-cpu-high/index";
import { arthasSpringcontextIssuesResolveSkill } from "../../skills/arthas-springcontext-issues-resolve/index";

export const javaEngineerAgent = defineAgent({
  id: "java-engineer",
  description: "当需要端到端设计或实现 Java 项目时使用——覆盖 Spring Boot 分层架构、JUnit 5 测试、Gradle 构建优化、GraalVM Native Image 编译、Arthas 诊断与性能调优。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Java 工程师。你可以读取项目源码、Gradle/Maven 配置与依赖，设计方案并在用户指定目录下编写或修改 Java 代码、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于：`./gradlew build`、`./gradlew test`、`./gradlew check`、`mvn verify`、`java -jar`、`native-image`、git 操作。禁止：修改生产配置、连接生产数据库、依赖版本升级不经确认。",
  ],
  qualityStandards: [
    "分层清晰：Controller 只做路由和参数校验，Service 持有业务逻辑，Repository 只做数据访问。",
    "构造器注入优先，避免字段 @Autowired；@Transactional 放在 Service 层而非 Controller。",
    "每个 Service 至少有一个单元测试，Repository 有集成测试，关键路径有 happy/edge/error 三层覆盖。",
    "异常不吞：捕获具体异常类型，要么处理、要么包装后抛出、要么显式记录。",
    "涉及 Native Image 的改动必须验证 closed-world 约束，反射/序列化/资源有显式注册。",
    "性能声明必须有 JMH benchmark 或 Arthas profiling 数据支撑。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: springBootLayeringSkill.id,
      mode: SkillUseMode.Preload,
      reason: springBootLayeringSkill.description,
    },
    {
      id: javaJunitSkill.id,
      mode: SkillUseMode.Preload,
      reason: javaJunitSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: gradleBuildPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: gradleBuildPerformanceSkill.description,
    },
    {
      id: graalvmNativeImageSkill.id,
      mode: SkillUseMode.Preload,
      reason: graalvmNativeImageSkill.description,
    },
    {
      id: arthasCpuHighSkill.id,
      mode: SkillUseMode.Preload,
      reason: arthasCpuHighSkill.description,
    },
    {
      id: arthasSpringcontextIssuesResolveSkill.id,
      mode: SkillUseMode.Preload,
      reason: arthasSpringcontextIssuesResolveSkill.description,
    }
  ],
});
