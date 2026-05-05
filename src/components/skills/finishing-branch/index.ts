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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
