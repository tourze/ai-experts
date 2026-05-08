import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineWorkflow,
  defineWorkflowStep,
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
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认目标平台（iOS/Android）、版本号、发布类型（新应用/更新/A/B 测试）、目标市场和截止日期。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按安全检查 → 审核合规 → ASO 优化 → 更新文案的顺序推进。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每个维度给出 pass / warn / fail 评级，warn 和 fail 必须附带修复建议。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "汇总后给出整体发布就绪判断：Ready / Conditional / Blocked。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "发布就绪报告：<app> <version>",
    sections: [
      defineAgentOutputSection({
        title: "发布概况",
        body: "[平台、版本、构建号、发布类型、目标市场]",
      }),
      defineAgentOutputSection({
        title: "安全检查",
        body: "[hardcoded secret / 调试开关 / 证书配置 / 权限风险]",
      }),
      defineAgentOutputSection({
        title: "审核合规",
        body: "[Apple/Android Guideline 合规逐项 / 隐私声明一致性]",
      }),
      defineAgentOutputSection({
        title: "ASO 评估",
        body: "[标题关键词 / 截图 / 分类 / 竞品覆盖]",
      }),
      defineAgentOutputSection({
        title: "更新文案",
        body: "[亮点提炼 / 本地化 / 用户可感知变更]",
      }),
      defineAgentOutputSection({
        title: "综合评定",
        body: "[Ready / Conditional / Blocked + 阻塞项清单]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未覆盖的 locale / 目标设备 / 测试环境]",
      }),
    ],
  }),
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
      reason: "评估关键词覆盖、截图和分类的 ASO 效果。",
    },
    {
      id: appleAppstoreReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "逐项校验 App Store 审核指南合规性。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每项检查结论标注事实/推断/假设。",
    }
  ],
});
