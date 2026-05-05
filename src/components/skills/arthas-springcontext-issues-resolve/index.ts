import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const arthasSpringcontextIssuesResolveSkill = defineSkill({
  id: "arthas-springcontext-issues-resolve",
  description: "当需要排查 Spring ApplicationContext、Bean 注册、条件装配或配置注入问题时使用。",
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
      summary: "Eval cases for arthas-springcontext-issues-resolve.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
