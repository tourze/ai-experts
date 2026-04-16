---
name: php-error-handling
description: 当用户要设计 PHP 异常层级、实现输入校验边界、做错误映射、处理批量部分失败或规范 try/catch 纪律时使用。
---

# PHP 错误处理

## 适用场景

- API、CLI、队列 worker 需要稳定处理坏输入和外部依赖失败。
- 需要建立统一异常层级和用户可见错误映射。
- 批处理场景要区分"全部失败"和"部分失败"。
- 现有代码到处 `catch (Exception $e)` 吞异常，需要收敛。

## 核心约束

- 先定义错误边界，再写 `try/catch`。不要一上来就全局兜底。
- 只捕获你能处理的异常类型；其余异常保留堆栈继续抛出。
- 异常分三层：验证错误 → 业务错误 → 外部系统错误。
- 用户可见消息与内部调试细节分离，不暴露 SQL、路径、堆栈。
- 用户输入必须在进入业务逻辑前完成校验和归一化。
- 批量处理支持部分失败汇总，不因一条坏数据丢掉整批。

## 代码模式

### 异常层级设计

```
DomainException (abstract, extends RuntimeException)
├── ValidationException    — 输入不合法
├── BusinessRuleException  — 规则不允许（如重复邮箱）
└── ExternalServiceException — 第三方不可用
```

代码示例见 [patterns.md](references/patterns.md)。

## 检查清单

- 异常分为验证层、业务层、外部依赖层，没有混为一体。
- `try/catch` 只出现在真正需要处理或转换异常的地方。
- 用户可见错误消息不包含堆栈、SQL、文件路径。
- 批量处理有部分失败汇总机制。
- 联动：[php-testing](../php-testing/SKILL.md) · [php-type-safety](../php-type-safety/SKILL.md)

## 反模式

- `catch (\Exception $e) {}` 吞掉异常，不记录也不重抛。
- 所有错误都塞进 `RuntimeException`，调用方无法区分。
- API 响应直接 `$e->getMessage()`，泄露内部信息。
- 每个方法都包一层 `try/catch`，把异常处理变成噪音。
- 捕获异常后返回 `null` 或 `false`，让调用方猜失败原因。
