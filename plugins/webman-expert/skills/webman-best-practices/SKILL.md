---
name: webman-best-practices
description: 用于 Webman 框架项目时必须使用。涵盖 DDD 架构（controller/service/domain/infrastructure 分层）、严格依赖规则、小写目录命名、PER 编码风格（declare(strict_types=1) 和 final 类）。适用于构建 Webman 应用、实施领域驱动设计或使用 Service 层模式。
license: MIT
metadata:
  author: webman-design
  version: "1.0.0"
---

Webman 框架最佳实践，遵循 DDD 架构、依赖规则和 PER 编码风格。

## 架构与依赖

- Controller 直接依赖 Model，跳过 Service 层 → 参见 [controller-skip-service](references/architecture/controller-skip-service.md)
- 领域层依赖框架类（Request、DB 等） → 参见 [domain-framework-dependency](references/architecture/domain-framework-dependency.md)
- Service 层与另一个 Service 存在循环依赖 → 参见 [service-circular-dependency](references/architecture/service-circular-dependency.md)
- 基础设施层未实现 Contract 接口 → 参见 [infrastructure-without-contract](references/architecture/infrastructure-without-contract.md)
- Service 中直接使用 Model 而非 Repository → 参见 [service-direct-model-access](references/architecture/service-direct-model-access.md)

## 命名规范

- 目录使用 camelCase 或 PascalCase → 参见 [directory-lowercase](references/naming/directory-lowercase.md)
- 接口缺少 Interface 后缀 → 参见 [interface-naming](references/naming/interface-naming.md)
- Service 未遵循 VerbNounService 模式 → 参见 [service-naming-pattern](references/naming/service-naming-pattern.md)
- Repository 实现缺少描述性前缀 → 参见 [repository-implementation-naming](references/naming/repository-implementation-naming.md)
- 命名空间与目录结构不匹配 → 参见 [namespace-directory-mismatch](references/naming/namespace-directory-mismatch.md)

## 代码风格（PER 编码风格）

- 文件开头缺少 declare(strict_types=1) → 参见 [strict-types-declaration](references/code-style/strict-types-declaration.md)
- 未默认使用 final class → 参见 [prefer-final-classes](references/code-style/prefer-final-classes.md)
- 不可变属性未使用 readonly → 参见 [readonly-properties](references/code-style/readonly-properties.md)
- 参数或返回值缺少类型声明 → 参见 [complete-type-declarations](references/code-style/complete-type-declarations.md)
- 未使用构造函数属性提升 → 参见 [constructor-property-promotion](references/code-style/constructor-property-promotion.md)

## 领域模式

- 实体缺少唯一标识 → 参见 [entity-identity](references/domain/entity-identity.md)
- 值对象可变 → 参见 [value-object-immutability](references/domain/value-object-immutability.md)
- 业务逻辑放在 Service 而非 Domain 中 → 参见 [business-logic-in-domain](references/domain/business-logic-in-domain.md)
- 副作用未使用领域事件 → 参见 [domain-events](references/domain/domain-events.md)
- 贫血领域模型（仅有 getter/setter） → 参见 [rich-domain-model](references/domain/rich-domain-model.md)

## 依赖注入

- 使用静态方法代替依赖注入 → 参见 [avoid-static-methods](references/architecture/avoid-static-methods.md)
- 未使用构造函数注入 → 参见 [constructor-injection](references/architecture/constructor-injection.md)
- 使用服务定位器模式代替依赖注入 → 参见 [no-service-locator](references/architecture/no-service-locator.md)
