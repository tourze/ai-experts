import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { vueExpertJsSkill } from "../../skills/vue-expert-js/index";
import { modernJavascriptPatternsSkill } from "../../skills/modern-javascript-patterns/index";
import { javascriptTypescriptJestSkill } from "../../skills/javascript-typescript-jest/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";

export const vueEngineerAgent = defineAgent({
  id: "vue-engineer",
  description: "当需要端到端设计或实现 Vue 3 前端项目时使用——覆盖 Composition API、响应式系统、Pinia 状态管理、Vue Router、Vite 构建配置、composable 设计、JSDoc 类型标注与现代 JavaScript 模式。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
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
      id: vueExpertJsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: modernJavascriptPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: javascriptTypescriptJestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
