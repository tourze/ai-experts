import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  checklist: [
    "动手前是否确认了当前分支、工作树状态和远端同步状态。",
    "改历史前是否判断“这是不是共享分支”。",
    "强推时是否用了 `--force-with-lease`。",
    "用 bisect 前是否准备了稳定、可脚本化的复现方式。",
    "恢复误操作时是否先用 reflog 开恢复分支，而不是继续覆盖现场。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "共享分支裸 force push",
      pass: "个人分支改 + --force-with-lease",
    }),
    defineAntiPattern({
      fail: "整支 merge 取一个提交",
      pass: "cherry-pick 精准搬运",
    }),
    defineAntiPattern({
      fail: "无稳定复现跑 bisect",
      pass: "可脚本化复现",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "动手前先跑 `git status --short`、`git branch --show-current`，必要时补 `git fetch origin` 和远端跟踪检查。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "清理本地 PR 历史时用 `git rebase -i --autosquash \"$(git merge-base HEAD origin/main)\"`，共享分支需先确认。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "只搬单个修复用 `git cherry-pick <sha>` 或范围 `<start>^..<end>`；需要自己组织提交时用 `git cherry-pick -n`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "定位回归先准备稳定脚本，再用 `git bisect start/bad/good/run/reset`；没有可脚本化复现不要硬跑。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "并行热修、主线和实验分支优先 `git worktree add -b ...`，删除前确认目标 worktree 没有未提交改动。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "恢复误操作先看 `git reflog --date=iso`，再 `git switch -c recovery/<topic> <sha>` 核对内容。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "现场确认：当前分支、工作树状态、远端/共享判断和风险动作确认。",
      "执行计划：选用 rebase/cherry-pick/bisect/worktree/reflog 的理由、命令和中止路径。",
      "结果记录：新 commit/分支、冲突处理、需要 push 的命令和后续验证。",
    ],
  }),
});
