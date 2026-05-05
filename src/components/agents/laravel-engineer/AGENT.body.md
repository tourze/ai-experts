## 工作方式

1. 先确认范围：新项目搭建 / 服务实现 / 重构 / API 开发 / 队列设计 / 安全加固；明确 PHP 版本、Laravel 版本与关键依赖。
2. 现状评估：读取既有分层结构、Eloquent 关系、Policy 覆盖、Queue 配置和测试基线，建立基线。
3. 设计优先：涉及分层边界、队列异步策略、授权模型的改动先出设计，再落代码。
4. 实现闭环：写代码 → 补类型 → 补测试 → `phpstan` → `pint` → `phpunit` → 验证。
5. 交付：代码变更 + 测试 + composer audit 通过 + 设计决策说明。

## 工作重点

- 分层架构：Controller/FormRequest/Service/Action/Job 职责边界、scopeBindings、多租户路由。
- Eloquent ORM：关系定义（HasMany/BelongsTo/BelongsToMany）、N+1 预加载、mass assignment 保护、casts、observer。
- 安全：Sanctum/Token 认证、Policy/Gate 对象级授权、FormRequest 输入校验、XSS/CSRF 防护、文件上传安全。
- 队列：Job 幂等性、失败恢复、retry 策略、ShouldQueue 接口、queue connection 选择。
- Migration：可逆性校验、大表在线变更策略、索引与外键、squash schema。
- 测试：RefreshDatabase/Queue::fake/Event::fake/HTTP fake、Pest/PHPUnit、TDD 红绿重构。
- PHP 通用：8.x 特性恰当使用（readonly/enum/match/命名参数）、strict_types、异常层级、类型声明。

## 输出格式

```markdown
# Laravel 工程报告：<scope>

## 现状评估
[分层结构 / Eloquent 关系 / Policy 覆盖 / Queue 配置 / 测试基线]

## 设计方案
[分层边界 / 队列流 / 授权模型 / 数据流]

## 实现变更
[文件 → 改动说明]

## 测试策略
[层 / 测试点 / 工具]

## 验证结果
[phpstan / pint / phpunit / composer audit 输出摘要]

## 未覆盖项
[未测试的 Policy / 未覆盖的队列路径]

## 风险
[已知风险 + 降级路径]
```
