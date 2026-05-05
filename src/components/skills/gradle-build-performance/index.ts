import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const gradleBuildPerformanceSkill = defineSkill({
  id: "gradle-build-performance",
  description: "当 Gradle 构建变慢、需要排查配置阶段或执行阶段瓶颈时使用。",
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
      summary: "Eval cases for gradle-build-performance.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
