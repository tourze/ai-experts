import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const networkTroubleshooterSkill = defineSkill({
  id: "network-troubleshooter",
  description: "当用户遇到 Linux 网络不通、DNS 解析异常、端口连不上、连接超时、TLS 报错或链路抖动时使用。",
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
      summary: "Eval cases for network-troubleshooter.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
