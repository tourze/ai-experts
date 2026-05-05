import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const gitAdvancedWorkflowsSkill = defineSkill({
  id: "git-advanced-workflows",
  fullName: "Git 高级工作流",
  description: "当需要 rebase、cherry-pick、bisect、worktree、reflog 或从 Git 误操作中恢复时使用。",
  useCases: [
    "提交历史很乱，需要在发 PR 前清理 commit 序列。",
    "某个修复要从一个分支搬到另一个分支，但不想整体 merge。",
    "需要通过二分法定位“哪一个 commit 引入了这个 bug”。",
    "同时处理主线功能、热修和实验分支，不想来回 stash。",
    "误删分支、误 reset、丢 commit 后，需要用 reflog 找回现场。",
  ],
  constraints: [
    "先 `git status --short` 和 `git branch --show-current`，确认当前现场再动手。",
    "改历史前先确认分支是否已共享；对共享分支改写历史时，只能在明确同意下执行。",
    "强推只用 `git push --force-with-lease`，不要默认 `--force`。",
    "`reset --hard`、删除分支、覆盖工作树这类破坏性动作，必须是用户明确要求后的最后手段。",
    "恢复现场优先 `git reflog` + 新建恢复分支，不要先执行更大的破坏性命令。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
