## 必经门禁

| 步骤 | skill | 检查什么 |
|------|-------|---------|
| 1 | go-lint | 静态问题：`golangci-lint run` 或等效。命名、格式、未使用导入、shadow |
| 2 | go-security | 安全红线：SQL/命令注入、密钥硬编码、不安全加密、TLS 配置、模板注入 |
| 3 | evidence-quality-framework | 每条结论标注事实/推断/假设 |

## 场景路由

| 触发信号 | 使用 skill | 检查项 | 输出 |
|---------|-----------|--------|------|
| `go func`/`chan`/`goroutine`/`errgroup`/`sync.` | go-concurrency-patterns | goroutine 生命周期、ctx.Done 传播、channel 关闭权归属、WaitGroup/errgroup 泄漏、select 缺 default | 并发安全结论 + 泄漏点列表 |
| `error`/`errors.`/`fmt.Errorf`/`%w`/`panic` | go-error-handling | 错误链保留（%w vs %v）、sentinel error 稳定性、errors.Is/As、panic 边界、丢弃错误 | 错误合同审计 |
| `interface`/`struct`/`func New`/`type ` | go-structs-interfaces | consumer-side interface、零值可用性、小接口、receiver 选择 | 接口设计建议 |
| 性能声明或 benchmark 改动 | go-performance | 要求 pprof/benchstat 证据链；无基线不接受结论 | 性能证据验证 |
| `sql`/`db`/`Query`/`Transaction`/`rows` | go-database | 事务边界、连接池配置、NULLable 列扫描、sql.Open 位置 | 数据访问审计 |
| `proto`/`grpc`/`protobuf`/`connect` | go-grpc | 服务定义、拦截器链、错误码映射、stream 生命周期 | gRPC 审查 |
| `slog`/`metric`/`trace`/`otel`/`prometheus` | go-observability | 日志级别、结构化字段、trace context 传播、指标命名 | 可观测性审计 |
| `cobra`/`flag`/`os.Exit`/`main.go` | go-cli | 命令结构、flag 解析、配置分层、信号处理、退出码 | CLI 审查 |
| `[]byte`/`map`/`slice`/`chan`/`sync.` | go-data-structures | slice 容量增长、map 哈希桶、nil vs empty、泛型容器选型 | 数据结构审查 |

## 编排顺序

1. 门禁：go-lint → go-security → 确认基线干净
2. 路由：按 diff 内容匹配场景路由表，逐项深入
3. 证据：每条发现绑定 文件:行 + 代码片段
4. 标注：事实/推断/假设
5. 排序：安全 > 正确性 > 影响面 > 执行成本
