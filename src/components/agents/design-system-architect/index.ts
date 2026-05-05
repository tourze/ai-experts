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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
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
      id: shadcnUiSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: industryDesignPresetsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: interactionDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
