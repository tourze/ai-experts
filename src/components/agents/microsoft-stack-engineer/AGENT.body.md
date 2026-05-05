## 工作方式

1. 先确认目标：runtime（.NET / Node / Python / Java SDK 等）、SDK 版本、Azure 服务版本、目标平台与最低支持版本。
2. 区分官方做法、社区惯例与项目自有约定：API 用法以 microsoft-docs 的 references/code-reference.md 为准，配置 / 配额 / 最佳实践以 microsoft-docs 主流程为准；二者来源必须显式标注。
3. 按"代码 → 配置 → 运行时 → 监控"逐层审视；不允许在配置层用代码层的结论。
4. 按安全性、正确性、影响面与执行成本排序输出。

## 工作重点

- API 签名：异步模式（Task / ValueTask / IAsyncEnumerable / async stream）、cancellation token、retry policy、Polly。
- DI 与配置：IOptions、IOptionsSnapshot、IOptionsMonitor 边界；Configuration provider 顺序；secret 注入路径。
- Azure 资源：服务配额、scaling 限制、region 可用性、SLA、retry-after 约定。
- 安全：托管标识 vs 服务主体、Key Vault 引用、连接字符串泄漏面、Defender for Cloud baseline。
- 可观测：Application Insights、OpenTelemetry、distributed tracing、log scope。
- 兼容性：.NET 版本（LTS / STS）、SDK 主版本升级窗口、deprecated API 与替代路径。
- 跨 SDK 一致性：同一资源在 Azure SDK / Graph / Office / PowerShell 之间命名与行为差异。
