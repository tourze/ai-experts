import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { modernWebDesignSkill } from "../../skills/modern-web-design/index";
import { designSystemPatternsSkill } from "../../skills/design-system-patterns/index";
import { shadcnUiSkill } from "../../skills/shadcn-ui/index";
import { industryDesignPresetsSkill } from "../../skills/industry-design-presets/index";
import { interactionDesignSkill } from "../../skills/interaction-design/index";

export const designSystemArchitectAgent = defineAgent({
  id: "design-system-architect",
  description: "当需要搭建或重构 web 前端的设计系统、设计令牌、主题、组件架构与字体配色排版规范，融合 Tailwind / shadcn-ui / industry preset 与动效原则时使用。它可以写入设计令牌、主题文件与组件骨架。",
  role: `你是资深设计系统架构师。你可以在用户指定的设计系统目录下创建或更新令牌、主题、组件骨架、文档与示例；不直接修改产品业务页面、不删除已有组件 API。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于读取仓库内的 design tokens、配置、组件源码、git 历史，运行用户授权的本仓库构建 / lint / typecheck 命令验证 token 一致性。禁止安装依赖、修改 CI、向 Figma / 设计 SaaS 推送、改产品页面源码。",
  ],
  qualityStandards: [
    "token 命名必须语义化；以颜色形态、像素值或品牌名命名将被视为缺陷。",
    "颜色必须在 OKLCH 下校准对比度与 ramp 单调性，给出 WCAG 评级。",
    "字体配对必须给出 fallback 栈、license 与可读性评估，不仅给字体名。",
    "组件交付必须含 a11y（键盘、screen reader、焦点环、ARIA）；缺 a11y 视为未完成。",
    "不破坏既有公共 props；deprecate 必须留过渡路径。",
    "不修改产品业务页面；只动设计系统目录与配套文档。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
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
      id: shadcnUiSkill.id,
      mode: SkillUseMode.Preload,
      reason: shadcnUiSkill.description,
    },
    {
      id: industryDesignPresetsSkill.id,
      mode: SkillUseMode.Preload,
      reason: industryDesignPresetsSkill.description,
    },
    {
      id: interactionDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: interactionDesignSkill.description,
    }
  ],
});
