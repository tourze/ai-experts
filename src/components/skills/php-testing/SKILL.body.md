## 联动说明

> 通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 [testing-patterns](testing-expert:testing-patterns)。本 skill 只覆盖 PHP 特有语法与工具。

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
