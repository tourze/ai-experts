import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const wiresharkAnalysisSkill = defineSkill({
  id: "wireshark-analysis",
  fullName: "网络流量分析",
  description: "当需要分析 PCAP、提取关键会话、定位异常连接、排查协议行为或重建时间线时使用。",
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
      summary: "Eval cases for wireshark-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
