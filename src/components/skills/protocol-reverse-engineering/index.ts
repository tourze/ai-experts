import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const protocolReverseEngineeringSkill = defineSkill({
  id: "protocol-reverse-engineering",
  fullName: "协议逆向工程",
  description: "当需要从抓包流量、固件二进制、设备通信或私有接口中还原协议帧、字段语义、状态机和编码规则时使用。",
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
      summary: "Eval cases for protocol-reverse-engineering.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
