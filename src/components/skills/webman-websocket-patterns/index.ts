import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
      summary: "Reference material for webman-websocket-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "connection-lifecycle",
      source: new URL("./references/connection-lifecycle.md", import.meta.url),
      target: "references/connection-lifecycle.md",
      title: "connection-lifecycle.md",
      summary: "Reference material for webman-websocket-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "reconnect-strategy",
      source: new URL("./references/reconnect-strategy.md", import.meta.url),
      target: "references/reconnect-strategy.md",
      title: "reconnect-strategy.md",
      summary: "Reference material for webman-websocket-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "websocket-server-setup",
      source: new URL("./references/websocket-server-setup.md", import.meta.url),
      target: "references/websocket-server-setup.md",
      title: "websocket-server-setup.md",
      summary: "Reference material for webman-websocket-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
