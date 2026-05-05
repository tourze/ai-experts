import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { systemDiagnosticsSkill } from "../system-diagnostics/index";

export const networkTroubleshooterSkill = defineSkill({
  id: "network-troubleshooter",
  fullName: "Linux 网络排障",
  description: "当用户遇到 Linux 网络不通、DNS 解析异常、端口连不上、连接超时、TLS 报错或链路抖动时使用。",
  useCases: [
    "用户说“没网了”“解析失败”“端口不通”“连接超时”“curl 握手失败”“服务偶发断开”。",
    "需要先拿系统整体快照时，先运行 `system-diagnostics`。",
    "若怀疑性能退化由网络引起，系统层面排查参考 system-diagnostics。",
  ],
  constraints: [
    "必须按链路层 → IP → 路由 → DNS → 端口 → 应用 的顺序排查，不能跳层。",
    "先用 IP 验证，再用域名验证，强制拆分 DNS 与路由问题。",
    "涉及防火墙、路由、sysctl 修改时，先读取当前配置并征得确认。",
    "报告里必须明确“失败点”和“支撑命令”，不是只给猜测。",
  ],
  checklist: [
    "[ ] `ip -br addr`、`ip route`、默认网关与接口状态正常。",
    "[ ] `ping` 网关和公网 IP，确认基本连通性。",
    "[ ] `getent hosts`、`resolvectl status` 或 `/etc/resolv.conf` 验证 DNS。",
    "[ ] `ss -tulpen` 与目标端口探测确认监听或出站连接是否存在。",
    "[ ] `curl -v`、`openssl s_client` 或应用日志验证 L7 故障。",
  ],
  relatedSkills: [
    {
      get id() {
        return systemDiagnosticsSkill.id;
      },
      reason: "需要先拿系统整体快照时，先运行 `system-diagnostics`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
