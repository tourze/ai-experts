---
name: webman-naming-conventions
description: 当用户要统一或审查 Webman 项目的目录命名、接口后缀、Service 命名或命名空间时使用。
---

Webman 项目命名与目录约束。

## 适用场景

- 统一目录命名、接口后缀、命名空间。
- 审查 Service/Repository 命名。
- 修复命名空间与目录不一致。

## 核心约束

- 目录小写，多词下划线。见 [directory-lowercase](references/directory-lowercase.md)。
- 接口 `Interface` 后缀。见 [interface-naming](references/interface-naming.md)。
- Service `VerbNounService`。见 [service-naming-pattern](references/service-naming-pattern.md)。
- 命名空间与目录一致。见 [namespace-directory-mismatch](references/namespace-directory-mismatch.md)。
- Repository 实现加技术前缀。见 [repository-implementation-naming](references/repository-implementation-naming.md)。

## 代码模式

```php
<?php
// App\Order\Service\PlaceOrderService
// App\Order\Domain\Repository\OrderRepositoryInterface
// App\Order\Infrastructure\EloquentOrderRepository
```

## 检查清单

- [ ] 目录全小写，无驼峰
- [ ] 接口用 `Interface` 后缀
- [ ] Service 命名表达动作
- [ ] 命名空间与目录路径一致

## 反模式

- 大小写混用 → 跨平台加载失败。见 [directory-lowercase](references/directory-lowercase.md)。
- 接口无后缀 → 可读性差。见 [interface-naming](references/interface-naming.md)。
- 命名空间漂移 → PSR-4 失败。见 [namespace-directory-mismatch](references/namespace-directory-mismatch.md)。
