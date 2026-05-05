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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-grpc.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
