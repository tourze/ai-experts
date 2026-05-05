import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
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
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认范围：新项目搭建 / Spring Boot 服务实现 / 重构 / 性能优化 / Native Image 编译 / 诊断排障；明确 Java 版本与关键依赖。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "现状评估：读取既有模块结构、分层合规性、测试覆盖和构建配置，建立基线。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "设计优先：涉及分层重构、异步边界、事务策略的改动先出设计，再落代码。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "实现闭环：写代码 → 补测试 → 跑 checkstyle/spotbugs → 跑 Gradle 构建 → 验证。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "交付：代码变更 + 测试 + 构建验证 + 设计决策说明。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Java 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[模块结构 / 分层合规 / 测试覆盖 / 构建基线]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[分层架构 / 事务策略 / 异步模型 / 数据流]",
      }),
      defineAgentOutputSection({
        title: "实现变更",
        body: "[文件 → 改动说明]",
      }),
      defineAgentOutputSection({
        title: "测试策略",
        body: "[层 / 测试点 / 工具]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[gradle build / gradle test / checkstyle 输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未测试的路径 / 未验证的 native-image 场景]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
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
