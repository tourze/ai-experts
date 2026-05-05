import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { uxHeuristicsSkill } from "../../skills/ux-heuristics/index";
import { uxResearcherDesignerSkill } from "../../skills/ux-researcher-designer/index";
import { frontendDesignReviewSkill } from "../../skills/frontend-design-review/index";
import { uxWritingSkill } from "../../skills/ux-writing/index";
import { responsiveDesignSkill } from "../../skills/responsive-design/index";
import { i18nLocalizationSkill } from "../../skills/i18n-localization/index";
import { figmaImplementDesignSkill } from "../../skills/figma-implement-design/index";
import { interactionDesignSkill } from "../../skills/interaction-design/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const uxReviewerAgent = defineAgent({
  id: "ux-reviewer",
  description: "当需要审查界面可用性、交互设计质量、信息架构、微文案或设计还原度时使用——覆盖启发式评估、用户研究方法、设计系统一致性、响应式和国际化。只读分析，产出 UX 审查报告。",
  role: `你是资深 UX 设计师和可用性工程师。你只读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "UX 审查报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "审查范围",
        body: "[页面/流程/组件 / 用户画像 / 核心任务路径]",
      }),
      defineAgentOutputSection({
        title: "启发式评估摘要",
        body: "[按 Nielsen 10 条逐项 / 违规数 / 严重度分布]",
      }),
      defineAgentOutputSection({
        title: "关键发现",
        body: `| 严重度 | 发现 | 启发式条目 | 位置 | 建议 |
|--------|------|-----------|------|------|`,
      }),
      defineAgentOutputSection({
        title: "交互流程",
        body: "[任务流断点 / 反馈缺失 / 错误预防 / 状态可见性问题]",
      }),
      defineAgentOutputSection({
        title: "信息架构",
        body: "[导航问题 / 标签不一致 / 搜索缺口]",
      }),
      defineAgentOutputSection({
        title: "微文案",
        body: "[按钮标签 / 错误消息 / 空态 / 表单提示问题]",
      }),
      defineAgentOutputSection({
        title: "响应式与国际化",
        body: "[断点问题 / 触控目标 / 硬编码文案 / RTL]",
      }),
      defineAgentOutputSection({
        title: "设计还原偏差",
        body: "[Figma vs 实现 / 组件替换 / 间距颜色字体偏差]",
      }),
      defineAgentOutputSection({
        title: "优先修复",
        body: "[按严重度 × 用户影响 × 修复成本排序]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未审查的页面 / 设备 / locale / 用户画像]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于只读探测：检查组件结构、CSS 文件、国际化资源文件、构建配置。禁止修改源码、样式或配置。",
  ],
  qualityStandards: [
    "每条发现绑定具体位置（文件路径 + 组件名或 DOM 位置），不用\"某些地方\"。",
    "区分可用性违规（必须修复）和设计偏好（建议）。",
    "不写泛泛建议，每条修复建议具体到可执行的改动。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: uxHeuristicsSkill.id,
      mode: SkillUseMode.Preload,
      reason: uxHeuristicsSkill.description,
    },
    {
      id: uxResearcherDesignerSkill.id,
      mode: SkillUseMode.Preload,
      reason: uxResearcherDesignerSkill.description,
    },
    {
      id: frontendDesignReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: frontendDesignReviewSkill.description,
    },
    {
      id: uxWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: uxWritingSkill.description,
    },
    {
      id: responsiveDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: responsiveDesignSkill.description,
    },
    {
      id: i18nLocalizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: i18nLocalizationSkill.description,
    },
    {
      id: figmaImplementDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: figmaImplementDesignSkill.description,
    },
    {
      id: interactionDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: interactionDesignSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
