import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const fridaDynamicAnalysisSkill = defineSkill({
  id: "frida-dynamic-analysis",
  fullName: "Frida 动态分析",
  description: "当需要用 Frida 做运行时 hook、trace、bypass 或动态分析时使用；涉及 Interceptor、Java.perform、ObjC.classes、内存扫描或自适应 bypass。",
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
      summary: "Eval cases for frida-dynamic-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
