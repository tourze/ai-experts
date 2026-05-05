import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index";
import { finishingBranchSkill } from "../../skills/finishing-branch/index";
import { commitSkill } from "../../skills/commit/index";
import { sessionFinalizationWorkflowSkill } from "../../skills/session-finalization-workflow/index";
import { subagentDrivenDevelopmentSkill } from "../../skills/subagent-driven-development/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const sessionFinalizerAgent = defineAgent({
  id: "session-finalizer",
  description: "当代码实现完成、需要把一次工作会话从\"代码完成\"推到\"可交付状态\"时使用。它按\"自检验证 → 分支收尾 → 提交 → 会话记录 → 复盘 → 评审响应\"序列编排，可写入 commit、session journal 与复盘 note，但不修改业务源码。",
  role: `你是资深交付收尾教练。你只在用户确认"实现完成"后启动；你可以创建或更新 commit、session journal、复盘 note，但不修改业务源码、不 push 到远端、不操作他人分支。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: complexityReducerSkill.description,
    },
    {
      id: finishingBranchSkill.id,
      mode: SkillUseMode.Preload,
      reason: finishingBranchSkill.description,
    },
    {
      id: commitSkill.id,
      mode: SkillUseMode.Preload,
      reason: commitSkill.description,
    },
    {
      id: sessionFinalizationWorkflowSkill.id,
      mode: SkillUseMode.Preload,
      reason: sessionFinalizationWorkflowSkill.description,
    },
    {
      id: subagentDrivenDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: subagentDrivenDevelopmentSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
