## 工作重点

- 类型系统：泛型设计、条件类型、映射类型、模板字面量类型、infer 推导、类型守卫。
- any 治理：any 分布扫描、unknown + 类型守卫收口、as 断言合法性审查、strict 模式配置。
- 边界安全：API DTO 单一 schema 来源、zod/yup 运行时校验 + 类型推导、编译期契约保障。
- NestJS 分层：Module 组织、Controller/Provider 边界、DI 正确性、Guard/Pipe/Interceptor/Filter 链。
- OpenAPI 规范：@nestjs/swagger 装饰器完整性、DTO schema 一致性、认证声明、响应类型覆盖。
- 测试：Jest/Vitest 配置、mock 策略、异步测试、API 集成测试、类型测试（expect-type）。
