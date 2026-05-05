# Protoc 与代码生成参考
## 1. protoc 命令
```bash
# Go + gRPC
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative api/proto/v1/user.proto
# 指定模块前缀
protoc --go_out=. --go_opt=module=github.com/example/project \
       --go-grpc_out=. --go-grpc_opt=module=github.com/example/project api/proto/v1/user.proto
```

| 选项 | 说明 |
|------|------|
| `paths=source_relative` | 输出与 proto 同目录结构 |
| `paths=import` | 按 import 路径生成（默认） |
| `module=xxx` | 去掉输出路径中的模块前缀 |

依赖：`protoc-gen-go` → `*.pb.go`，`protoc-gen-go-grpc` → `*_grpc.pb.go`。
## 2. buf 替代方案
`buf` 提供 lint、breaking change 检测和远程代码生成，适合 proto 超 10 个或多仓库共享场景。

```yaml
# buf.gen.yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen
    opt: paths=source_relative
  - remote: buf.build/grpc/go
    out: gen
    opt: paths=source_relative
```

```bash
buf generate   # 代码生成
buf lint       # proto lint
buf breaking api/proto --against '.git#ref=main,subdir=api/proto'
```
## 3. Proto3 语法要点
```protobuf
syntax = "proto3";
package example.v1;
option go_package = "github.com/example/project/gen/v1;v1";
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (stream ListUsersResponse);
  rpc UploadFile(stream UploadRequest) returns (UploadResponse);
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}
message GetUserRequest { string id = 1; }
message GetUserResponse { string id = 1; string name = 2; }
```

规则：字段编号不可复用（`reserved` 保护）；默认零值，需区分用 `optional`；枚举从 0 开始；`repeated` → `[]T`，`map<K,V>` → `map[K]V`。
## 4. gRPC Gateway（REST 代理）
将 gRPC 暴露为 REST JSON API，适用于需同时支持两种协议的场景。

```protobuf
import "google/api/annotations.proto";
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse) {
    option (google.api.http) = { get: "/v1/users/{id}" };
  }
}
```

生成：`protoc --grpc-gateway_out=. --grpc-gateway_opt=paths=source_relative api/proto/v1/user.proto`

```go
mux := runtime.NewServeMux()
pb.RegisterUserServiceHandlerFromEndpoint(ctx, mux, "localhost:9090",
    []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())})
```
## 5. 拦截器、流式 RPC 与错误码
```go
func UnaryLog(ctx context.Context, req interface{},
    info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    log.Printf("method=%s dur=%s err=%v", info.FullMethod, time.Since(start), err)
    return resp, err
}
s := grpc.NewServer(
    grpc.ChainUnaryInterceptor(UnaryLog, AuthInterceptor),
    grpc.ChainStreamInterceptor(StreamLog))
// 服务端流：检查 context 取消
func (s *Server) ListEvents(req *pb.ListEventsRequest,
    stream pb.EventService_ListEventsServer) error {
    for _, e := range query(stream.Context(), req.Topic) {
        select { case <-stream.Context().Done(): return stream.Context().Err(); default: }
        if err := stream.Send(&pb.ListEventsResponse{Event: e}); err != nil { return err }
    }
    return nil
}
// 服务端：业务 → gRPC status
if errors.Is(err, sql.ErrNoRows) {
    return nil, status.Errorf(codes.NotFound, "user %s not found", req.Id)
}
return nil, status.Errorf(codes.Internal, "query: %v", err)
// 客户端：gRPC status → 业务
st, ok := status.FromError(err)
if ok {
    switch st.Code() {
    case codes.NotFound:        return ErrNotFound
    case codes.InvalidArgument: return fmt.Errorf("bad input: %s", st.Message())
    default:                    return fmt.Errorf("rpc: %v", st.Code())
    }
}
```
## 6. 客户端连接与 TLS
```go
conn, err := grpc.NewClient("dns:///svc.example.com:443",
    grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})),
    grpc.WithKeepaliveParams(keepalive.ClientParameters{
        Time: 30 * time.Second, Timeout: 10 * time.Second, PermitWithoutStream: true}))
defer conn.Close()
```

mTLS：传含 `Certificates` + `ClientCAs` 的 `tls.Config`。`ClientConn` 自带多路复用，无需手写连接池；多端点负载均衡用 `dns:///` resolver 自动轮询。
