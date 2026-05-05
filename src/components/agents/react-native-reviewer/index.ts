import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { reactNativeDesignSkill } from "../../skills/react-native-design/index";
import { reactNativeJsPerformanceSkill } from "../../skills/react-native-js-performance/index";
import { reactNativePlatformForkSkill } from "../../skills/react-native-platform-fork/index";
import { detoxMobileTestSkill } from "../../skills/detox-mobile-test/index";
import { reactNativeTurbomoduleSkill } from "../../skills/react-native-turbomodule/index";
import { reactNativeMetroConfigSkill } from "../../skills/react-native-metro-config/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const reactNativeReviewerAgent = defineAgent({
  id: "react-native-reviewer",
  description: "当需要只读审查 React Native 架构、导航、列表性能、JSI/Bridge、原生模块和平台分叉 时使用。",
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
      id: reactNativeDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeJsPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativePlatformForkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: detoxMobileTestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeTurbomoduleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: reactNativeMetroConfigSkill.id,
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
