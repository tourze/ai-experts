## 实现要点

- 服务端用 `pb.RegisterXxxServer(s, &impl{})` 注册实现。
- 客户端统一用 `grpc.NewClient(target, opts...)` + `grpc.WithTransportCredentials`。
- 错误返回必须用 `status.Errorf(codes.XXX, ...)`，禁止裸 `errors.New`。
- 拦截器用 `grpc.ChainUnaryInterceptor` / `grpc.ChainStreamInterceptor` 组合。
