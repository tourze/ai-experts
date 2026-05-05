import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { memorySafetyPatternsSkill } from "../../skills/memory-safety-patterns/index";
import { codeReviewSkill } from "../../skills/code-review/index";
import { debugMethodologySkill } from "../../skills/debug-methodology/index";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const cppReviewerAgent = defineAgent({
  id: "cpp-reviewer",
  description: "当需要执行 C/C++ 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: memorySafetyPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: memorySafetyPatternsSkill.description,
    },
    {
      id: codeReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewSkill.description,
    },
    {
      id: debugMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: debugMethodologySkill.description,
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: complexityReducerSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
