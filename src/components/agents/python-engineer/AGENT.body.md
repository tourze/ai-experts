## 工作重点

- 类型安全：Protocol、TypedDict、泛型、TypeGuard、mypy strict 模式、pyright 配置。
- 错误处理：异常层级设计、输入校验边界、部分失败治理、try/except 纪律。
- 异步：asyncio、TaskGroup、timeout、cancellation、并发 I/O 模式。
- 性能：cProfile/py-spy profiling、分配优化、GIL 认知、C 扩展边界。
- 设计模式：服务层分离、Repository 模式、Dependency Injection、组合优于继承。
- 可观测性：structlog 结构化日志、OpenTelemetry、Prometheus metrics、请求上下文。
- 后台任务：Celery/RQ/arq worker、幂等、重试、死信队列、任务幂等设计。
- 测试：pytest fixtures、mock、参数化、异步测试、集成测试策略。
- 包管理：uv 初始化、依赖管理、lockfile、workspace、CI 集成。
