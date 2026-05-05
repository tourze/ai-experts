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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: androidArchitectureSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: androidCoroutinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: androidDesignGuidelinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: androidAccessibilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: androidTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: gradleBuildPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: androidRedexSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
