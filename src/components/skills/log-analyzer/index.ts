import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const logAnalyzerSkill = defineSkill({
  id: "log-analyzer",
  fullName: "日志分析",
  description: "当用户需要查日志、对齐时间线、关联错误上下文或定位根因时使用。",
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
      summary: "Eval cases for log-analyzer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
