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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  model: "sonnet",
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: modernWebDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: designSystemPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: responsiveDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: shadcnUiSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: figmaImplementDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: i18nLocalizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: bundleOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: interactionDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: webPerformanceDiagnosisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: frontendDesignReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: uxWritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
