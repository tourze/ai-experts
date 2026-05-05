import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { modernWebDesignSkill } from "../../skills/modern-web-design/index";
import { designSystemPatternsSkill } from "../../skills/design-system-patterns/index";
import { responsiveDesignSkill } from "../../skills/responsive-design/index";
import { shadcnUiSkill } from "../../skills/shadcn-ui/index";
import { figmaImplementDesignSkill } from "../../skills/figma-implement-design/index";
import { i18nLocalizationSkill } from "../../skills/i18n-localization/index";
import { bundleOptimizationSkill } from "../../skills/bundle-optimization/index";
import { interactionDesignSkill } from "../../skills/interaction-design/index";
import { webPerformanceDiagnosisSkill } from "../../skills/web-performance-diagnosis/index";
import { frontendDesignReviewSkill } from "../../skills/frontend-design-review/index";
import { uxWritingSkill } from "../../skills/ux-writing/index";

export const frontendEngineerAgent = defineAgent({
  id: "frontend-engineer",
  description: "当需要端到端设计或实现现代 Web 前端项目时使用——覆盖响应式布局、设计系统集成、shadcn/ui 组件、Figma 设计还原、多语言国际化、Bundle 优化、微交互实现与 Web 性能诊断。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Web 前端工程师。你可以读取项目源码、package.json 与设计稿，设计方案并在用户指定目录下编写或修改 HTML/CSS/JavaScript/TypeScript 代码、组件、测试与设计文档；不修改生产密钥、API 端点或部署配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "前端工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[组件结构 / 路由配置 / 样式方案 / 打包配置 / 性能基线]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[布局方案 / 组件拆分 / 数据流 / 状态管理 / 国际化策略]",
      }),
      defineAgentOutputSection({
        title: "实现变更",
        body: "[文件 → 改动说明]",
      }),
      defineAgentOutputSection({
        title: "测试策略",
        body: "[层 / 测试点 / 工具]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[构建 / lint / 测试 / 性能指标输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未实现的浏览器 / 未覆盖的组件状态 / 未测试的交互路径]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`npm run dev`、`npm run build`、`npm test`、`pnpm build`、`npx tsc --noEmit`、`npx eslint`、`npx prettier --check`、git 操作。禁止：修改生产配置、连接外部 API 不经确认、`npm install` 不经确认的依赖变更。",
  ],
  qualityStandards: [
    "响应式布局在所有目标断点下无布局偏移和内容截断。",
    "设计系统 token 在组件中一致使用，无硬编码颜色/间距/字体值。",
    "Figma 还原度在主要页面组件上像素级对齐。",
    "所有面向用户的文本通过 i18n 框架管理，无硬编码文案。",
    "Bundle 体积有基线对比，代码分割策略合理。",
    "微交互不影响无障碍（prefers-reduced-motion 尊重），不阻塞关键内容渲染。",
    "LCP < 2.5s、FID < 100ms、CLS < 0.1 的目标在主流设备上可达成。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  claudeModel: "sonnet",
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: modernWebDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: modernWebDesignSkill.description,
    },
    {
      id: designSystemPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: designSystemPatternsSkill.description,
    },
    {
      id: responsiveDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: responsiveDesignSkill.description,
    },
    {
      id: shadcnUiSkill.id,
      mode: SkillUseMode.Preload,
      reason: shadcnUiSkill.description,
    },
    {
      id: figmaImplementDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: figmaImplementDesignSkill.description,
    },
    {
      id: i18nLocalizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: i18nLocalizationSkill.description,
    },
    {
      id: bundleOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: bundleOptimizationSkill.description,
    },
    {
      id: interactionDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: interactionDesignSkill.description,
    },
    {
      id: webPerformanceDiagnosisSkill.id,
      mode: SkillUseMode.Preload,
      reason: webPerformanceDiagnosisSkill.description,
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
    }
  ],
});
