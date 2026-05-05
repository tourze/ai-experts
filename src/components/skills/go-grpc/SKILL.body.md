## 适用场景

- 定义 `.proto` 文件或生成 Go gRPC 代码。
- 实现服务端注册、客户端连接、拦截器链。
- 处理流式 RPC（服务端流、客户端流、双向流）。
- gRPC 错误码映射、TLS/mTLS 配置、keepalive 调优。
- 与 [go-error-handling](../go-error-handling/SKILL.md) 配合处理跨层错误传播；与 [go-performance](../go-performance/SKILL.md) 配合优化序列化与连接复用。

## 核心约束

- **Proto 组织**：一个 service 一个 proto 文件；package 用 `lowercase_snake`；`go_package` 必须显式声明。
- **服务端注册**：用 `pb.RegisterXxxServer(s, &impl{})`；`grpc.NewServer` 通过 `ServerOption` 注入拦截器。
- **客户端连接**：禁止废弃的 `grpc.Dial` + `WithInsecure`；统一 `grpc.NewClient(target, opts...)` + `grpc.WithTransportCredentials`。
- **错误处理**：服务端返回错误必须用 `status.Errorf(codes.Internal, ...)` 等标准错误码，禁止裸 `errors.New`；客户端用 `status.FromError` 解析。
- **拦截器**：用 `grpc.ChainUnaryInterceptor` / `grpc.ChainStreamInterceptor` 组合多个，不要用单个 `grpc.UnaryInterceptor` 只传一个链。
- **context**：interceptor 中不要创建新 context 替换原始 ctx；客户端超时用 `context.WithTimeout`。

## 常见错误

| 错误 | 修复 |
|------|------|
| `grpc.Dial` + `WithInsecure` | 改用 `grpc.NewClient` + `insecure.NewCredentials()` |
| 服务端返回裸 `errors.New` | 改用 `status.Errorf(codes.Internal, ...)` |
| proto 未设 `go_package` | 显式 `option go_package = "pkg/path;pkgname";` |
| 单个 `grpc.UnaryInterceptor` 传多个函数 | 改用 `grpc.ChainUnaryInterceptor(f1, f2)` |
| 客户端不设 keepalive | 添加 `WithKeepaliveParams` 防空闲断连 |
| 流式 RPC 不检查取消 | 循环中检查 `stream.Context().Done()` |
| 大消息超 4MB 默认限制 | 设 `grpc.MaxRecvMsgSize` / `grpc.MaxSendMsgSize` |
| TLS 设 `InsecureSkipVerify: true` | 生产环境必须验证证书 |

## 深度参考

- [protoc-reference.md](references/protoc-reference.md) — protoc 命令、buf 替代、proto3 语法、代码生成、gRPC Gateway、拦截器/流式/错误码代码模式
- [Go gRPC 官方文档](https://grpc.io/docs/languages/go/)
- [gRPC 错误码](https://grpc.io/docs/guides/status-codes/)
