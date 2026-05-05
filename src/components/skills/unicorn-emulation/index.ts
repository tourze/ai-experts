import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const unicornEmulationSkill = defineSkill({
  id: "unicorn-emulation",
  fullName: "Unicorn 模拟执行",
  description: "当需要用 Unicorn 引擎模拟执行特定函数、绕过环境依赖或离线调试加密/解密算法时使用。",
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
      summary: "Eval cases for unicorn-emulation.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
