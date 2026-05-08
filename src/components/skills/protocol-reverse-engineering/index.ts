import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  checklist: [
    "确认采集点、时间同步和请求/响应方向。",
    "识别帧头、长度、消息类型、序号、校验和。",
    "把状态转换和错误码单独列出。",
    "必要时回到客户端代码或固件做字段交叉验证。",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "单包推协议",
      pass: "多样本对比",
    }),
    defineAntiPattern({
      fail: "无方向推字段",
      pass: "标注方向 + 时序",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先整理多个请求 / 响应样本，标注方向、时间、端点、会话状态和采集点。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "拆分传输层、帧边界、长度字段、消息类型、序号、校验和、压缩或加密层。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "用多样本差异推字段含义，不确定字段标置信度，避免单包命名。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把状态转换、错误码和重传 / 心跳 / 握手流程单独建表。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "常用 tshark / xxd 初筛命令读取 `frame-triage`；字段需要实现证据时联动 `binary-analysis-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "样本来源、方向、端点、时间线和帧边界判断。",
      "字段表：offset、长度、候选含义、证据、置信度和样本覆盖范围。",
      "状态机、错误码、校验 / 编码规则和需要更多样本的未知项。",
    ],
  }),
  references: [
    defineReference({
      id: "frame-triage",
      source: new URL("./references/frame-triage.md", import.meta.url),
      target: "references/frame-triage.md",
      title: "协议帧初筛命令",
      summary: "tshark、xxd 和字段提取命令，用于从 PCAP 或二进制帧样本整理协议证据。",
      loadWhen: "需要从抓包或样本帧中提取十六进制、方向、frame number 或 data 字段时读取。",
    }),
  ],
});
