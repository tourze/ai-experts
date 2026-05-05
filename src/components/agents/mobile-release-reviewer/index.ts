import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { appStoreOptimizationSkill } from "../../skills/app-store-optimization/index";
import { appleAppstoreReviewerSkill } from "../../skills/apple-appstore-reviewer/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const mobileReleaseReviewerAgent = defineAgent({
  id: "mobile-release-reviewer",
  description: "当 iOS/Android 应用准备提审或发版时使用——检查二进制安全、审核指南合规、ASO 优化和更新文案。只读分析，产出发布就绪报告。",
  role: `你是资深移动端发布工程师。你只读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于只读探测：检查 Info.plist、AndroidManifest.xml、构建配置、字符串提取、文件结构分析。禁止修改构建产物、签名文件或上传到应用商店。",
  ],
  qualityStandards: [
    "审核合规检查基于最新版 App Store Review Guidelines 和 Google Play Policy。",
    "ASO 建议给出具体关键词和文案，不泛泛而谈。",
    "区分\"必须修复才能发布\"和\"建议优化\"的发现。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: appStoreOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: appStoreOptimizationSkill.description,
    },
    {
      id: appleAppstoreReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: appleAppstoreReviewerSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
