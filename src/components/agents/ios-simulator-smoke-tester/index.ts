import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { iosSimulatorSkillSkill } from "../../skills/ios-simulator-skill/index";
import { swiftuiPerformanceAuditSkill } from "../../skills/swiftui-performance-audit/index";
import { detoxMobileTestSkill } from "../../skills/detox-mobile-test/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const iosSimulatorSmokeTesterAgent = defineAgent({
  id: "ios-simulator-smoke-tester",
  description: "当需要用本目录 simulator 脚本执行 iOS 模拟器冒烟测试时使用。它启动或选择模拟器、启动 app、读取无障碍树、走关键流程并报告用户可见阻断。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: iosSimulatorSkillSkill.id,
      mode: SkillUseMode.Preload,
      reason: iosSimulatorSkillSkill.description,
    },
    {
      id: swiftuiPerformanceAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: swiftuiPerformanceAuditSkill.description,
    },
    {
      id: detoxMobileTestSkill.id,
      mode: SkillUseMode.Preload,
      reason: detoxMobileTestSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
