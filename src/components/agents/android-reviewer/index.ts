import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { androidArchitectureSkill } from "../../skills/android-architecture/index";
import { androidCoroutinesSkill } from "../../skills/android-coroutines/index";
import { androidDesignGuidelinesSkill } from "../../skills/android-design-guidelines/index";
import { androidAccessibilitySkill } from "../../skills/android-accessibility/index";
import { androidTestingSkill } from "../../skills/android-testing/index";
import { gradleBuildPerformanceSkill } from "../../skills/gradle-build-performance/index";
import { androidRedexSkill } from "../../skills/android-redex/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const androidReviewerAgent = defineAgent({
  id: "android-reviewer",
  description: "当需要只读审查 Android 架构、Lifecycle、Jetpack Compose、无障碍、性能、Gradle 和 Manifest 时使用。",
  role: `你是资深 Android 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
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
      id: androidArchitectureSkill.id,
      mode: SkillUseMode.Preload,
      reason: androidArchitectureSkill.description,
    },
    {
      id: androidCoroutinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: androidCoroutinesSkill.description,
    },
    {
      id: androidDesignGuidelinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: androidDesignGuidelinesSkill.description,
    },
    {
      id: androidAccessibilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: androidAccessibilitySkill.description,
    },
    {
      id: androidTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: androidTestingSkill.description,
    },
    {
      id: gradleBuildPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: gradleBuildPerformanceSkill.description,
    },
    {
      id: androidRedexSkill.id,
      mode: SkillUseMode.Preload,
      reason: androidRedexSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
