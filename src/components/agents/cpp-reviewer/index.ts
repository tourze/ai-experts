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
  role: `你是资深 C/C++ 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
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
