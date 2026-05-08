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
import { youtubeAnalysisSkill } from "../../skills/youtube-analysis/index";
import { youtubeSearchSkill } from "../../skills/youtube-search/index";
import { xiaohongshuCommercialGrowthSkill } from "../../skills/xiaohongshu-commercial-growth/index";
import { fanOperationsSkill } from "../../skills/fan-operations/index";
import { douyinViralContentSkill } from "../../skills/douyin-viral-content/index";
import { copywritingSkill } from "../../skills/copywriting/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const socialGrowthPlannerAgent = defineAgent({
  id: "social-growth-planner",
  description: "当需要设计社交媒体增长策略时使用。它综合个人品牌、平台内容、粉丝运营、私域、变现和平台安全，输出行动计划。",
  role: `你是资深社交媒体策略师。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点和同层模式，建立证据链。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按安全性、正确性、影响面和执行成本排序输出。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "社交增长计划：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "阶段评估",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "平台策略",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "框架分析",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "跨框架综合",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "30/60/90 天执行计划",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "内容日历",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "风险标记",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  qualityStandards: [
    "每条建议必须平台特定。",
    "内容格式要给具体例子。",
    "变现建议要匹配粉丝量和阶段。",
    "所有内容建议都要检查平台安全风险。",
    "按目标选择 3-5 个框架，不机械套用全部框架。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: youtubeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "分析 YouTube 频道数据制定视频增长策略。",
    },
    {
      id: youtubeSearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: "搜索 YouTube 竞品视频与热点话题。",
    },
    {
      id: xiaohongshuCommercialGrowthSkill.id,
      mode: SkillUseMode.Preload,
      reason: "制定小红书商业化变现与内容增长策略。",
    },
    {
      id: fanOperationsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "设计粉丝运营与私域转化方案。",
    },
    {
      id: douyinViralContentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "策划抖音爆款内容与传播策略。",
    },
    {
      id: copywritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供文案创作方法论，支撑内容日历输出。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "标注策略建议的依据来源与可信度。",
    }
  ],
});
