import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const reactPerformanceSkill = defineSkill({
  id: "react-performance",
  fullName: "React 性能优化",
  description: "当用户要分析或优化 React 渲染性能、不必要重渲染或外部 store 订阅问题时使用。",
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
      summary: "Eval cases for react-performance.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
