import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const wiresharkAnalysisSkill = defineSkill({
  id: "wireshark-analysis",
  fullName: "网络流量分析",
  description: "当需要分析 PCAP、提取关键会话、定位异常连接、排查协议行为或重建时间线时使用。",
  useCases: [
    "需要对抓包文件进行过滤、跟流、字段提取和异常定位。",
    "需要与 [nmap](../ethical-hacking-methodology/SKILL.md) 的端口画像交叉验证暴露服务。",
    "需要把会话样本交给 [protocol-reverse-engineering](../protocol-reverse-engineering/SKILL.md) 深挖协议。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
