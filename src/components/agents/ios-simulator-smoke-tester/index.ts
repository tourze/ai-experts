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
  role: `你是资深 iOS QA 工程师。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
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
