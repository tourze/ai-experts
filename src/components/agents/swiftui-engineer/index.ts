import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { swiftuiUiPatternsSkill } from "../../skills/swiftui-ui-patterns/index";
import { swiftuiPerformanceAuditSkill } from "../../skills/swiftui-performance-audit/index";
import { swiftConcurrencyExpertSkill } from "../../skills/swift-concurrency-expert/index";
import { iosHigDesignSkill } from "../../skills/ios-hig-design/index";
import { liquidGlassDesignSkill } from "../../skills/liquid-glass-design/index";
import { macosDesignGuidelinesSkill } from "../../skills/macos-design-guidelines/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const swiftuiEngineerAgent = defineAgent({
  id: "swiftui-engineer",
  description: "当需要设计、审查或重构 SwiftUI 视图、导航、列表性能、Swift Concurrency，或按 iOS HIG / macOS HIG / Liquid Glass 规范实现界面时使用。它只读分析视图与代码，不直接修改业务文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: swiftuiUiPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: swiftuiUiPatternsSkill.description,
    },
    {
      id: swiftuiPerformanceAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: swiftuiPerformanceAuditSkill.description,
    },
    {
      id: swiftConcurrencyExpertSkill.id,
      mode: SkillUseMode.Preload,
      reason: swiftConcurrencyExpertSkill.description,
    },
    {
      id: iosHigDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: iosHigDesignSkill.description,
    },
    {
      id: liquidGlassDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: liquidGlassDesignSkill.description,
    },
    {
      id: macosDesignGuidelinesSkill.id,
      mode: SkillUseMode.Preload,
      reason: macosDesignGuidelinesSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
