import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { springBootLayeringSkill } from "../../skills/spring-boot-layering/index";
import { javaJunitSkill } from "../../skills/java-junit/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { gradleBuildPerformanceSkill } from "../../skills/gradle-build-performance/index";
import { graalvmNativeImageSkill } from "../../skills/graalvm-native-image/index";
import { arthasCpuHighSkill } from "../../skills/arthas-cpu-high/index";
import { arthasSpringcontextIssuesResolveSkill } from "../../skills/arthas-springcontext-issues-resolve/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const javaReviewerAgent = defineAgent({
  id: "java-reviewer",
  description: "当需要执行 Java 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
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
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
