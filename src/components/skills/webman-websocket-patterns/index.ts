import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const webmanWebsocketPatternsSkill = defineSkill({
  id: "webman-websocket-patterns",
  fullName: "Webman Websocket Patterns",
  description: "当用户要在 Webman 中搭建或排查 WebSocket 服务端、心跳、频道广播或客户端重连时使用。",
  useCases: [
    "搭建 WebSocket 服务端或客户端。",
    "管理连接生命周期、心跳、频道广播。",
  ],
  constraints: [
    "声明 `listen => 'websocket://...'`，设 `reloadable => false`。见 [websocket-server-setup](references/websocket-server-setup.md)。",
    "`onConnect` 分配 ID，`onWebSocketConnect` 认证，失败用 `pauseRecv()`。见 [connection-lifecycle](references/connection-lifecycle.md)。",
    "跨进程广播走 Redis pub/sub。见 [channel-subscription](references/channel-subscription.md)。",
    "客户端重连：指数退避 + 抖动 + 最大重试。见 [reconnect-strategy](references/reconnect-strategy.md)。",
  ],
  checklist: [
    "`reloadable => false` 且 `reusePort => true`",
    "`onClose` 清理频道订阅和定时器",
    "私有频道要求签名验证",
    "心跳容许偶尔丢包",
    "多 Worker 通过 Redis pub/sub 广播",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "多 Worker 仅用内存数组",
      pass: "Redis pub/sub 跨进程",
    }),
    defineAntiPattern({
      fail: "断线立即重连",
      pass: "指数退避 + 抖动",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "channel-subscription",
      source: new URL("./references/channel-subscription.md", import.meta.url),
      target: "references/channel-subscription.md",
      title: "channel-subscription.md",
      summary: "Webman WebSocket 频道订阅与 Redis pub/sub 跨进程广播的实现方案。",
      loadWhen: "需要实现多 Worker 间的消息广播或私有频道的签名验证时读取。",
    }),
    defineReference({
      id: "connection-lifecycle",
      source: new URL("./references/connection-lifecycle.md", import.meta.url),
      target: "references/connection-lifecycle.md",
      title: "connection-lifecycle.md",
      summary: "Webman WebSocket 连接生命周期管理，包括 onConnect、onWebSocketConnect 和 onClose。",
      loadWhen: "需要设计连接的认证、ID 分配和清理逻辑时读取。",
    }),
    defineReference({
      id: "reconnect-strategy",
      source: new URL("./references/reconnect-strategy.md", import.meta.url),
      target: "references/reconnect-strategy.md",
      title: "reconnect-strategy.md",
      summary: "WebSocket 客户端重连策略，指数退避加抖动的算法与实现。",
      loadWhen: "需要实现客户端断线重连逻辑或优化现有重连策略时读取。",
    }),
    defineReference({
      id: "websocket-server-setup",
      source: new URL("./references/websocket-server-setup.md", import.meta.url),
      target: "references/websocket-server-setup.md",
      title: "websocket-server-setup.md",
      summary: "Webman WebSocket 服务端配置与搭建指南，包括 listen 声明和进程参数设置。",
      loadWhen: "需要搭建 WebSocket 服务端或配置进程参数时读取。",
    }),
  ],
});
