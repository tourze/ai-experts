# PHP 测试

> 通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 [testing-patterns](testing-expert:testing-patterns)。本 skill 只覆盖 PHP 特有语法与工具。

## 适用场景

- 编写新的 PHPUnit / Pest 测试类、测试方法和测试夹具。
- 审查或重构已有测试，降低脆弱断言、过度 Mock 和复制粘贴。
- 统一 `#[Test]`、数据提供者、覆盖率边界与测试分组。
- 调整 `phpunit.xml` 的严格模式、套件划分和覆盖率策略。

## 核心约束

- 测试文件启用 `declare(strict_types=1)`，保持显式类型。
- 优先用 PHP 8 属性（`#[Test]`、`#[DataProvider]`、`#[CoversClass]`），不用旧式注解。
- 集成测试要明确边界、清理状态、避免环境耦合。

## 代码模式

代码示例见 [examples.md](references/examples.md)。

## 检查清单

- 编码标准：[strict_types](rules/standard-strict-types.md) · [final 类](rules/standard-final-classes.md) · [类型提示](rules/standard-visibility-type-hints.md)
- 属性与数据集：[#[Test]](rules/attr-test-attribute.md) · [#[CoversClass]](rules/attr-covers-class.md) · [DataProvider](rules/data-provider.md)
- Mock 与集成：[避免过度 Mock](rules/mock-avoid-over-mocking.md) · [HTTP 冒烟](rules/integration-smoke-http.md) · [事务清理](rules/integration-transactions.md)
- 联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-error-handling](../php-error-handling/SKILL.md) · [php-type-safety](../php-type-safety/SKILL.md)

## 反模式

### FAIL: 一测多行为

```php
#[Test]
public function it_works(): void {
    $order = $svc->create($data);
    self::assertSame('paid', $order->status);
    self::assertSame(99.0, $order->total);
    self::assertCount(1, $order->items);
    // 失败时不知道是哪条断言挂了
}
```

### PASS: 一测一行为

```php
#[Test]
public function create_persists_order_with_paid_status(): void { ... }

#[Test]
public function create_calculates_total_from_items(): void { ... }
```

### FAIL: Mock 被测对象内部

```php
$svc = $this->createPartialMock(OrderService::class, ['calculateTotal']);
$svc->method('calculateTotal')->willReturn(99.0);
// 重构 calculateTotal 后，测试一团糟
```

### PASS: 只 mock 外部边界

```php
$gateway = $this->createMock(PaymentGateway::class);
$gateway->method('charge')->willReturn(true);
$svc = new OrderService($gateway);  // 真实 Service，假 Gateway
```
