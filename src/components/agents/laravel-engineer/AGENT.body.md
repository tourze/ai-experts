## 工作重点

- 分层架构：Controller/FormRequest/Service/Action/Job 职责边界、scopeBindings、多租户路由。
- Eloquent ORM：关系定义（HasMany/BelongsTo/BelongsToMany）、N+1 预加载、mass assignment 保护、casts、observer。
- 安全：Sanctum/Token 认证、Policy/Gate 对象级授权、FormRequest 输入校验、XSS/CSRF 防护、文件上传安全。
- 队列：Job 幂等性、失败恢复、retry 策略、ShouldQueue 接口、queue connection 选择。
- Migration：可逆性校验、大表在线变更策略、索引与外键、squash schema。
- 测试：RefreshDatabase/Queue::fake/Event::fake/HTTP fake、Pest/PHPUnit、TDD 红绿重构。
- PHP 通用：8.x 特性恰当使用（readonly/enum/match/命名参数）、strict_types、异常层级、类型声明。
