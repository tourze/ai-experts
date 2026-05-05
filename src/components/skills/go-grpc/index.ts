import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goGrpcSkill = defineSkill({
  id: "go-grpc",
  fullName: "go-grpc",
  description: "当 Go 代码涉及 gRPC/protobuf：服务定义、服务端/客户端实现、拦截器、流式 RPC、错误码、TLS 或性能优化时使用。",
  useCases: [
    "定义 `.proto` 文件或生成 Go gRPC 代码。",
    "实现服务端注册、客户端连接、拦截器链。",
    "处理流式 RPC（服务端流、客户端流、双向流）。",
    "gRPC 错误码映射、TLS/mTLS 配置、keepalive 调优。",
    "与 [go-error-handling](../go-error-handling/SKILL.md) 配合处理跨层错误传播；与 [go-performance](../go-performance/SKILL.md) 配合优化序列化与连接复用。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "protoc-reference",
      source: new URL("./references/protoc-reference.md", import.meta.url),
      target: "references/protoc-reference.md",
      title: "protoc-reference.md",
      summary: "Reference material for go-grpc.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
