import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const protocolReverseEngineeringSkill = defineSkill({
  id: "protocol-reverse-engineering",
  fullName: "协议逆向工程",
  description: "当需要从抓包流量、固件二进制、设备通信或私有接口中还原协议帧、字段语义、状态机和编码规则时使用。",
  useCases: [
    "需要从 PCAP、串口、USB、TCP/UDP 报文中整理字段、顺序和状态机。",
    "需要和 [wireshark-analysis](../wireshark-analysis/SKILL.md) 配合做流量整理。",
    "需要和 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 对照客户端或固件中的编解码实现。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
