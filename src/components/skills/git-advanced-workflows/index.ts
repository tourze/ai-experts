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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
