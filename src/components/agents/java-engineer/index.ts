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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
