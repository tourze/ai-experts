import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const arthasCpuHighSkill = defineSkill({
  id: "arthas-cpu-high",
  fullName: "Arthas CPU 飙高排查",
  description: "当 JVM 或 Java 应用 CPU 飙高、负载异常时使用。",
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
      summary: "Eval cases for arthas-cpu-high.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
