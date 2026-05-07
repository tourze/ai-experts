import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const finishingBranchSkill = defineSkill({
  id: "finishing-branch",
  fullName: "完成开发分支",
  description: "当实现完成、测试通过、需要决定如何集成工作时使用——引导完成开发分支的验证、选项展示和清理工作。",
  useCases: [
    "功能实现完毕，所有测试通过，需要决定下一步。",
    "子代理驱动开发完成后的收尾。",
    "需要从 feature 分支合并回主分支。",
    "需要在提交或合并前做最后验证、选项展示和 worktree 清理。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在\"灵活变通\"。**",
    "测试未通过，不展示选项。",
    "不替用户做选择——展示选项，等用户决定。",
    "丢弃操作必须二次确认。",
  ],
  checklist: [
    "测试全部通过",
    "展示了 4 个选项（不多不少）",
    "等待用户选择（不自动执行）",
    "丢弃操作获得了明确确认",
    "合并后重新验证了测试",
    "适当清理了 worktree",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先运行项目测试套件；测试失败就展示失败列表并停止，不进入选项展示。",
      "测试通过后确定基线分支：`git merge-base HEAD main`，失败再尝试 `master`。",
      "展示且只展示 4 个选项：本地合并回基线、推送并创建 PR、保留分支原样、丢弃这些工作。",
      "选项 1 本地合并：切到基线、pull、merge feature、合并后重新跑测试，测试通过才删除 feature 分支。",
      "选项 2 创建 PR：push feature 分支并创建 PR，保留 worktree。",
      "选项 3 保留原样：报告分支名和 worktree 路径，不清理。",
      "选项 4 丢弃：展示将删除的分支、提交和 worktree，等待用户输入 `discard` 或 `确认丢弃`。",
      "对选项 1、2、4 检查 worktree 状态并按选择清理；选项 3 保留。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试验证结果：命令、通过/失败、失败列表和是否允许继续。",
      "四选项提示：本地合并、创建 PR、保留原样、丢弃工作，不替用户选择。",
      "执行结果：合并/PR/保留/丢弃动作、分支状态、worktree 状态和后续入口。",
    ],
  }),
});
