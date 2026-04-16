---
name: php-testing
description: 当用户编写、审查或重构 PHP 测试时使用。覆盖 PHPUnit 和 Pest 的测试结构、数据提供者、属性、Mock、集成测试与 phpunit.xml 配置收敛。
---

# PHP 测试

## 适用场景

- 编写新的 PHPUnit / Pest 测试类、测试方法和测试夹具。
- 审查或重构已有测试，降低脆弱断言、过度 Mock 和复制粘贴。
- 统一 `#[Test]`、数据提供者、覆盖率边界与测试分组。
- 调整 `phpunit.xml` 的严格模式、套件划分和覆盖率策略。

## 核心约束

- FIRST：快速、隔离、可重复、自校验、及时编写。
- 每个测试只表达一个行为断言，用 AAA（Arrange / Act / Assert）组织。
- 测试文件启用 `declare(strict_types=1)`，保持显式类型。
- 优先用 PHP 8 属性（`#[Test]`、`#[DataProvider]`、`#[CoversClass]`），不用旧式注解。
- Mock 只隔离外部协作者，不 Mock 被测系统内部实现。
- 集成测试要明确边界、清理状态、避免环境耦合。

## 代码模式

代码示例见 [examples.md](references/examples.md)。

## 检查清单

- 原则类规则：[AAA](rules/principle-aaa-pattern.md) · [FIRST:快速](rules/principle-first-fast.md) · [FIRST:隔离](rules/principle-first-isolated.md) · [FIRST:可重复](rules/principle-first-repeatable.md)
- 编码标准：[strict_types](rules/standard-strict-types.md) · [final 类](rules/standard-final-classes.md) · [类型提示](rules/standard-visibility-type-hints.md)
- 属性与数据集：[#[Test]](rules/attr-test-attribute.md) · [#[CoversClass]](rules/attr-covers-class.md) · [DataProvider](rules/data-provider.md)
- Mock 与集成：[避免过度 Mock](rules/mock-avoid-over-mocking.md) · [HTTP 冒烟](rules/integration-smoke-http.md) · [事务清理](rules/integration-transactions.md)
- 联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-error-handling](../php-error-handling/SKILL.md) · [php-doc](../php-doc/SKILL.md)

## 反模式

- 一个测试同时验证多个行为，失败后无法定位根因。
- 继续使用 `@test`、`@dataProvider` 旧式注解。
- 复用共享可变状态，导致测试顺序依赖。
- Mock 被测对象内部实现，使重构变成"改测试"。
- 测试名只写 `test1`、`it_works`，看不出业务行为。
- phpunit.xml 关闭严格模式，吞掉 risky / warning。
