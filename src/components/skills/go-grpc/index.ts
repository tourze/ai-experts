import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goErrorHandlingSkill } from "../go-error-handling/index";
import { goPerformanceSkill } from "../go-performance/index";

export const goGrpcSkill = defineSkill({
  id: "go-grpc",
  fullName: "go-grpc",
  description: "当 Go 代码涉及 gRPC/protobuf：服务定义、服务端/客户端实现、拦截器、流式 RPC、错误码、TLS 或性能优化时使用。",
  useCases: [
    "定义 `.proto` 文件或生成 Go gRPC 代码。",
    "实现服务端注册、客户端连接、拦截器链。",
    "处理流式 RPC（服务端流、客户端流、双向流）。",
    "gRPC 错误码映射、TLS/mTLS 配置、keepalive 调优。",
    "与 `go-error-handling` 配合处理跨层错误传播；与 `go-performance` 配合优化序列化与连接复用。",
  ],
  constraints: [
    "**Proto 组织**：一个 service 一个 proto 文件；package 用 `lowercase_snake`；`go_package` 必须显式声明。",
    "**服务端注册**：用 `pb.RegisterXxxServer(s, &impl{})`；`grpc.NewServer` 通过 `ServerOption` 注入拦截器。",
    "**客户端连接**：禁止废弃的 `grpc.Dial` + `WithInsecure`；统一 `grpc.NewClient(target, opts...)` + `grpc.WithTransportCredentials`。",
    "**错误处理**：服务端返回错误必须用 `status.Errorf(codes.Internal, ...)` 等标准错误码，禁止裸 `errors.New`；客户端用 `status.FromError` 解析。",
    "**拦截器**：用 `grpc.ChainUnaryInterceptor` / `grpc.ChainStreamInterceptor` 组合多个，不要用单个 `grpc.UnaryInterceptor` 只传一个链。",
    "**context**：interceptor 中不要创建新 context 替换原始 ctx；客户端超时用 `context.WithTimeout`。",
  ],
  relatedSkills: [
    {
      get id() {
        return goPerformanceSkill.id;
      },
      reason: "与 `go-error-handling` 配合处理跨层错误传播；与 `go-performance` 配合优化序列化与连接复用。",
    },
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      reason: "与 `go-error-handling` 配合处理跨层错误传播；与 `go-performance` 配合优化序列化与连接复用。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用 `grpc.Dial` + `WithInsecure`。",
      pass: "改用 `grpc.NewClient` + `insecure.NewCredentials()`。",
    }),
    defineAntiPattern({
      fail: "服务端返回裸 `errors.New`。",
      pass: "改用 `status.Errorf(codes.Internal, ...)`。",
    }),
    defineAntiPattern({
      fail: "proto 未设 `go_package`。",
      pass: "显式 `option go_package = \"pkg/path;pkgname\";`。",
    }),
    defineAntiPattern({
      fail: "单个 `grpc.UnaryInterceptor` 传多个函数。",
      pass: "改用 `grpc.ChainUnaryInterceptor(f1, f2)`。",
    }),
    defineAntiPattern({
      fail: "客户端不设 keepalive。",
      pass: "添加 `WithKeepaliveParams` 防空闲断连。",
    }),
    defineAntiPattern({
      fail: "流式 RPC 不检查取消。",
      pass: "循环中检查 `stream.Context().Done()`。",
    }),
    defineAntiPattern({
      fail: "大消息超 4MB 默认限制。",
      pass: "设 `grpc.MaxRecvMsgSize` / `grpc.MaxSendMsgSize`。",
    }),
    defineAntiPattern({
      fail: "TLS 设 `InsecureSkipVerify: true`。",
      pass: "生产环境必须验证证书。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认 proto、生成命令、服务端注册、客户端凭据、deadline 和拦截器需求。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "服务端用生成的 Register 方法注册实现，客户端统一设置 transport credentials 和超时。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "错误必须转成 `status.Errorf(codes.XXX, ...)`，拦截器用 chain 组合。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "实现要点读取 `implementation-guide`；protoc / buf / 生成细节读取 `protoc-reference`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "gRPC 服务注册、客户端连接、deadline、credentials 和 interceptor 方案。",
      "错误 code 映射、proto 生成命令和测试建议。",
      "兼容性、观测和安全风险。",
    ],
  }),
  references: [
    defineReference({
      id: "implementation-guide",
      source: new URL("./references/implementation-guide.md", import.meta.url),
      target: "references/implementation-guide.md",
      title: "Go gRPC 实现要点",
      summary: "服务注册、客户端连接、status error 和拦截器组合的实现约束。",
      loadWhen: "需要快速审查 Go gRPC 服务端或客户端实现时读取。",
    }),
    defineReference({
      id: "protoc-reference",
      source: new URL("./references/protoc-reference.md", import.meta.url),
      target: "references/protoc-reference.md",
      title: "protoc-reference.md",
      summary: "protoc 编译器用法、proto 文件组织、命名规则与生成代码选项。",
      loadWhen: "需要编写 .proto 文件或配置 protoc 生成 Go gRPC 代码时读取。",
    }),
  ],
});
