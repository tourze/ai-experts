import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const finishingBranchSkill = defineSkill({
  id: "finishing-branch",
  fullName: "完成开发分支",
  description: "当实现完成、测试通过、需要决定如何集成工作时使用——引导完成开发分支的验证、选项展示和清理工作。",
  useCases: [
    "功能实现完毕，所有测试通过，需要决定下一步。",
    "子代理驱动开发完成后的收尾。",
    "需要从 feature 分支合并回主分支。",
    "交叉引用：提交用 `commit`；合并前审查配合 `pre-landing-review`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
