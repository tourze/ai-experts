import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const idapythonScriptingSkill = defineSkill({
  id: "idapython-scripting",
  description: "当需要编写 IDAPython 脚本做函数遍历、交叉引用、字节搜索、Hex-Rays 反编译或 IDALib 批量分析时使用。",
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
      summary: "Eval cases for idapython-scripting.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
