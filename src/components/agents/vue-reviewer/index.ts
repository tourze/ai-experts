import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { vueExpertJsSkill } from "../../skills/vue-expert-js/index";
import { modernJavascriptPatternsSkill } from "../../skills/modern-javascript-patterns/index";
import { javascriptTypescriptJestSkill } from "../../skills/javascript-typescript-jest/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const vueReviewerAgent = defineAgent({
  id: "vue-reviewer",
  description: "当需要只读审查 Vue 3 Composition API、响应式、组件设计、Pinia、Router 和模板性能 时使用。",
  role: `你是资深 Vue.js 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: vueExpertJsSkill.id,
      mode: SkillUseMode.Preload,
      reason: vueExpertJsSkill.description,
    },
    {
      id: modernJavascriptPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: modernJavascriptPatternsSkill.description,
    },
    {
      id: javascriptTypescriptJestSkill.id,
      mode: SkillUseMode.Preload,
      reason: javascriptTypescriptJestSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
