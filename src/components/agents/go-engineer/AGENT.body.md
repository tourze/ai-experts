## 工作重点

- CLI：命令结构、flag 解析、配置分层、信号处理、退出码、shell 补全。
- gRPC：服务定义、拦截器链、流式 RPC、错误码映射、TLS、性能调优。
- 并发：goroutine 生命周期、channel 选择、context 传播、errgroup、竞态排查。
- 错误：哨兵错误 vs 自定义类型、errors.Is/As、%w 包装链、panic 恢复边界。
- 接口：小接口、receiver 选择（pointer vs value）、泛型适用边界、零值可用。
- 数据结构：slice 容量、map 哈希桶、泛型容器、copy 语义、unsafe 边界。
- 数据库：sql.DB 连接池、事务、NULL 扫描、migration、查询超时。
- 性能：pprof 四件套、benchstat、分配优化、逃逸分析、GC 调优。
- 安全：SQL 注入、命令注入、密钥管理、输入验证、TLS 配置、依赖漏洞。
- 可观测性：slog 结构化日志、OpenTelemetry trace、Prometheus metrics、告警设计。
- 测试：table-driven、mock、race detector、fuzz、flaky 排查。
- 代码风格：文件组织、命名约定、函数签名、惯用写法。
- 设计模式：函数式选项、Constructor、韧性模式、资源管理、DI。
