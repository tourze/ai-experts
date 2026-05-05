import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { appStoreOptimizationSkill } from "../../skills/app-store-optimization/index.js";
import { appleAppstoreReviewerSkill } from "../../skills/apple-appstore-reviewer/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const mobileReleaseReviewerAgent = defineAgent({
  id: "mobile-release-reviewer",
  description: "当 iOS/Android 应用准备提审或发版时使用——检查二进制安全、审核指南合规、ASO 优化和更新文案。只读分析，产出发布就绪报告。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: appStoreOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: appleAppstoreReviewerSkill.id,
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
