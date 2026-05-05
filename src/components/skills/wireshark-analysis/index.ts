import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { ethicalHackingMethodologySkill } from "../ethical-hacking-methodology/index";
import { protocolReverseEngineeringSkill } from "../protocol-reverse-engineering/index";

export const wiresharkAnalysisSkill = defineSkill({
  id: "wireshark-analysis",
  fullName: "网络流量分析",
  description: "当需要分析 PCAP、提取关键会话、定位异常连接、排查协议行为或重建时间线时使用。",
  useCases: [
    "需要对抓包文件进行过滤、跟流、字段提取和异常定位。",
    "需要与 `nmap` 的端口画像交叉验证暴露服务。",
    "需要把会话样本交给 `protocol-reverse-engineering` 深挖协议。",
  ],
  constraints: [
    "先确认抓包点、时区和采集窗口，再解释流量。",
    "优先用显示过滤器收窄数据集，避免在全量流量里盲看。",
    "保存原始 PCAP，不在原始证据上改写。",
    "异常结论必须绑定具体流、时间和端点。",
  ],
  checklist: [
    "确认时间线、端点、协议层次和异常流。",
    "对关键连接跟流并导出证据。",
    "把基线流量与异常流量分开描述。",
    "必要时导出字段表供后续协议分析。",
  ],
  relatedSkills: [
    {
      get id() {
        return protocolReverseEngineeringSkill.id;
      },
      reason: "需要把会话样本交给 `protocol-reverse-engineering` 深挖协议。",
    },
    {
      get id() {
        return ethicalHackingMethodologySkill.id;
      },
      label: "nmap",
      reason: "需要与 `nmap` 的端口画像交叉验证暴露服务。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无过滤肉眼翻",
      pass: "显示过滤收窄",
    }),
    defineAntiPattern({
      fail: "截图无过滤表达式",
      pass: "留可复现命令",
    }),
    defineAntiPattern({
      fail: "无端点定性",
      pass: "端点 + 基线对比",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
