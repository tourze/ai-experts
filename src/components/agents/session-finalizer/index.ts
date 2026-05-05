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
  bashBoundary: [
    "Bash 用于 `git status` / `git diff [--cached] [--stat]` / `git log` / `git blame` / `git stash list` / 用户授权的本仓库测试 / lint / typecheck / build 命令、`gh pr view` / `gh api` 只读查询、`git add <具体文件>`、`git commit -m`。\n\n禁止：\n- `git push`、`git push --force` 任何形式（push 由用户主导）。\n- `git reset --hard`、`git checkout -- .`、`git restore --source=HEAD`、`git clean -f`、`git branch -D`、`git stash drop|clear`。\n- `git commit --no-verify` / `--no-gpg-sign`（hooks / 签名不可绕过）。\n- `git commit -m \"$(cat <<EOF ...)\"` heredoc 形式。\n- `git add -A` / `git add .` 批量暂存。\n- `git rebase -i` / `git add -i` 交互式命令。\n- `git rebase --no-edit`、amend 已经 push 到远端的 commit。\n- 跨工作树或全局 `git config` 修改。\n\n任何越界请求一律拒绝并要求用户在主对话直接执行。",
  ],
  qualityStandards: [
    "启动门未通过禁止继续；不允许\"先收尾再补完成\"。",
    "验证结果必须如实报告：通过 / 失败 / 跳过 三态显式，不模糊化。",
    "commit 不允许把无关改动一起带入；发现脏文件来源不明，停下问用户，不静默 stash。",
    "不主动 push 到远端；用户明确要求 push 时才输出 push 命令供用户审视。",
    "复盘条目必须可执行（\"下次遇到 X 时做 Y\"），禁止\"以后注意一下\"类口号。",
    "任何破坏性 git 命令命中黑名单立刻 `🚫 BLOCKED` 并报告原因，不退而求其次。",
  ],
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
