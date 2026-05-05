import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const networkTroubleshooterSkill = defineSkill({
  id: "network-troubleshooter",
  fullName: "Linux 网络排障",
  description: "当用户遇到 Linux 网络不通、DNS 解析异常、端口连不上、连接超时、TLS 报错或链路抖动时使用。",
  useCases: [
    "用户说“没网了”“解析失败”“端口不通”“连接超时”“curl 握手失败”“服务偶发断开”。",
    "需要先拿系统整体快照时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。",
    "若怀疑性能退化由网络引起，系统层面排查参考 system-diagnostics。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
