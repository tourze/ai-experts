## 代码模式

代码示例见 [examples.md](references/examples.md)。

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
