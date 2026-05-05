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
