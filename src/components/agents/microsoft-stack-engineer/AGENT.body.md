## 工作重点

- API 签名：异步模式（Task / ValueTask / IAsyncEnumerable / async stream）、cancellation token、retry policy、Polly。
- DI 与配置：IOptions、IOptionsSnapshot、IOptionsMonitor 边界；Configuration provider 顺序；secret 注入路径。
- Azure 资源：服务配额、scaling 限制、region 可用性、SLA、retry-after 约定。
- 安全：托管标识 vs 服务主体、Key Vault 引用、连接字符串泄漏面、Defender for Cloud baseline。
- 可观测：Application Insights、OpenTelemetry、distributed tracing、log scope。
- 兼容性：.NET 版本（LTS / STS）、SDK 主版本升级窗口、deprecated API 与替代路径。
- 跨 SDK 一致性：同一资源在 Azure SDK / Graph / Office / PowerShell 之间命名与行为差异。
