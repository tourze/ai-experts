import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const commitSkill = defineSkill({
  id: "commit",
  fullName: "Git Commit — 结构化提交流程",
  description: "当用户要求提交代码、commit 变更或完成一组改动需要入库时使用。",
  useCases: [
    "当用户要求提交代码、commit 变更或完成一组改动需要入库时使用。",
  ],
  constraints: [
    "Iron Law：没有审查 staged diff，不允许执行 commit。",
    "必须精确暂存当前任务文件；禁止 `git add .`、`git add *`、`git add -A`、`git add --all`、`git add -u`。",
    "提交前必须审查 `git diff --cached --stat` 和 `git diff --cached`。",
    "同一文件存在 staged 与 unstaged 变更时，必须分别检查两边 diff，避免部分暂存混淆。",
    "提交信息必须使用 Conventional Commits，且首行说明具体改动和原因，不用模糊 `fix/update`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "改动很小就跳过 staged diff 审查。",
      pass: "小改动也看 `git diff --cached`，确认无调试代码、敏感信息和无关 hunk。",
    }),
    defineAntiPattern({
      fail: "为了方便使用 `git add .` 或 `git add -A`。",
      pass: "逐文件或同模块显式路径暂存，知道每个进入提交的文件。",
    }),
    defineAntiPattern({
      fail: "提交信息只写 `fix`、`update` 或“调整”。",
      pass: "使用 `type(scope): description`，描述改了什么以及为什么。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把当前任务相关变更精确暂存、审查 staged diff、写出合格 Conventional Commit 并验证提交结果。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先并行查看 `git status --short`、`git diff --stat`、`git log --oneline -5`，识别改动范围和最近提交风格。",
      "逐个或按同模块显式路径 `git add <file...>` 暂存当前任务文件，不使用批量 add。",
      "审查 `git diff --cached --stat` 和完整 `git diff --cached`，确认没有无关文件、调试代码、敏感信息或错误范围。",
      "若存在部分暂存，分别运行 `git diff --cached -- <file>` 和 `git diff -- <file>` 检查 staged/unstaged。",
      "按 `<type>(<scope>): <description>` 写提交信息；type 使用 feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert。",
      "用 `git commit -m \"...\"` 或多个 `-m` 提交，禁止 heredoc 和不带 `-m` 的交互提交。",
      "提交后运行 `git log --oneline -3` 验证成功记录。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "提交前状态：modified/untracked、最近提交风格、是否有无关改动或部分暂存。",
      "Staged 审查结果：文件范围、stat、关键 diff 风险、测试/构建状态和拆分理由。",
      "提交结果：commit SHA、message、涉及文件和剩余工作区状态。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Git 提交流程纪律守卫：提交前检查清单与常见纪律违规案例。",
      loadWhen: "需要确保提交质量或检查是否有违规提交行为时读取。",
    }),
  ],
});
