import {
  AgentSandbox,
  defineAgent,
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
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  model: "sonnet",
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
