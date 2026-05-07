import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "`ip -br addr`、`ip route`、默认网关与接口状态正常。",
    "`ping` 网关和公网 IP，确认基本连通性。",
    "`getent hosts`、`resolvectl status` 或 `/etc/resolv.conf` 验证 DNS。",
    "`ss -tulpen` 与目标端口探测确认监听或出站连接是否存在。",
    "`curl -v`、`openssl s_client` 或应用日志验证 L7 故障。",
  ],
  relatedSkills: [
    {
      get id() {
        return systemDiagnosticsSkill.id;
      },
      reason: "需要先拿系统整体快照时，先运行 `system-diagnostics`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跳层诊断",
      pass: "分层递进",
    }),
    defineAntiPattern({
      fail: "refused vs timeout 不分",
      pass: "按症状定位",
    }),
    defineAntiPattern({
      fail: "单次 ping 判断间歇问题",
      pass: "长时采样",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "按链路层、IP、路由、DNS、端口和应用层分层定位 Linux 网络故障，并给出失败点和支撑命令。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先采样 `ip -br addr`、`ip route`、DNS 配置和目标主机/端口，明确症状是 timeout、refused、解析失败还是 TLS/应用错误。",
      "先用 IP 验证连通性，再用域名验证，拆开路由和 DNS；默认网关、公网 IP、目标域名依次检查。",
      "端口层用监听状态、`ss`、`/dev/tcp` 或等效探测确认；应用层用 `curl -v`、`openssl s_client` 或日志确认。",
      "需要改防火墙、路由或 sysctl 时先读取当前配置并征得确认；间歇问题要长时采样。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "网络路径分层证据：接口、路由、DNS、端口、TLS/应用层。",
      "明确失败点、支撑命令、stderr/返回码摘要和已排除层级。",
      "建议修复动作、需确认的配置变更和需要系统诊断的资源信号。",
    ],
  }),
  tools: [],
});
