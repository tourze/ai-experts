## 代码模式

### 1. 先按问题类型加载参考资料

| 主题 | 参考文件 | 何时加载 |
|---|---|---|
| 控制器与路由 | `references/controllers-routing.md` | REST 路由、参数管道、版本控制、Swagger |
| 服务与依赖注入 | `references/services-di.md` | Provider、Repository、作用域、模块导出 |
| DTO 与验证 | `references/dtos-validation.md` | `class-validator`、嵌套对象、类型转换 |
| 认证与授权 | `references/authentication.md` | JWT、Passport、Guard、`@Public()`、RBAC |
| 测试 | `references/testing-patterns.md` | 单测、控制器测试、E2E、mock 仓储 |
| Express 迁移 | `references/migration-from-express.md` | 旧 Express 服务向 NestJS 重构 |

### 2. 交付顺序固定，先骨架再细节

交付顺序、DTO/Module/Controller/Service 完整骨架见 [references/basic-scaffold.md](references/basic-scaffold.md)。

### 3. 测试至少覆盖"成功路径 + 失败路径"

单测示例见 [references/testing-patterns.md](references/testing-patterns.md)：用 `Test.createTestingModule` 注入 mock Repository，分别断言创建成功与 `ConflictException` 抛出。
