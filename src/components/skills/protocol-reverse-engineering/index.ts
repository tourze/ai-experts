import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";
import { wiresharkAnalysisSkill } from "../wireshark-analysis/index";

export const protocolReverseEngineeringSkill = defineSkill({
  id: "protocol-reverse-engineering",
  fullName: "协议逆向工程",
  description: "当需要从抓包流量、固件二进制、设备通信或私有接口中还原协议帧、字段语义、状态机和编码规则时使用。",
  useCases: [
    "需要从 PCAP、串口、USB、TCP/UDP 报文中整理字段、顺序和状态机。",
    "需要和 `wireshark-analysis` 配合做流量整理。",
    "需要和 `binary-analysis-patterns` 对照客户端或固件中的编解码实现。",
  ],
  constraints: [
    "先收集多个样本，再推字段语义，不要拿单包强行命名。",
    "把传输层、帧边界、编码方式、校验和加密层拆开分析。",
    "记录方向、会话状态、长度字段和错误响应。",
    "不确定的字段要明确标注置信度。",
  ],
  relatedSkills: [
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      reason: "需要和 `binary-analysis-patterns` 对照客户端或固件中的编解码实现。",
    },
    {
      get id() {
        return wiresharkAnalysisSkill.id;
      },
      reason: "需要和 `wireshark-analysis` 配合做流量整理。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
