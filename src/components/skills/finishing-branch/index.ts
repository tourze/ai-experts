import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const finishingBranchSkill = defineSkill({
  id: "finishing-branch",
  fullName: "完成开发分支",
  description: "当实现完成、测试通过、需要决定如何集成工作时使用——引导完成开发分支的验证、选项展示和清理工作。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for finishing-branch.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
