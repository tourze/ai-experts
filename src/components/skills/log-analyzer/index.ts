import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const logAnalyzerSkill = defineSkill({
  id: "log-analyzer",
  fullName: "日志分析",
  description: "当用户需要查日志、对齐时间线、关联错误上下文或定位根因时使用。",
  useCases: [
    "按时间窗追踪异常请求、崩溃、超时或重试风暴。",
    "需要从系统日志和应用日志里抽出关键线索。",
    "已知服务异常，但还不知道第一处异常副作用在哪里出现。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
