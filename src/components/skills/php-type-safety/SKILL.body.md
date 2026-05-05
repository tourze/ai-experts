## 代码模式

### 关键模式速查

| 场景 | 标注方式 |
|------|----------|
| 键值对数组 | `array<string, int>` |
| 结构化数组 | `array{id: int, name: string, tags?: list<string>}` |
| 连续列表 | `list<User>` |
| 泛型集合 | `@template T` + `Collection<T>` |
| 条件返回 | `@return ($throw is true ? User : User\|null)` |
| 类型断言 | `@phpstan-assert User $value` |

代码示例与配置模板见 [patterns.md](references/patterns.md)。

PHPDoc 文档模式与反模式见 [advanced-patterns.md](references/advanced-patterns.md)。

## 反模式

### FAIL: @var 强转

```php
$cache->get('user:1') /** @var User $user */;
$user->getName();  // 实际可能是 null / array
// PHPStan 闭嘴 / 运行时崩
```

### PASS: assert 收窄

```php
$user = $cache->get('user:1');
if (!$user instanceof User) {
    throw new RuntimeException('cache poisoning');
}
$user->getName();  // PHPStan 知道是 User
```

### FAIL: 无理由 ignore

```php
foreach ($items as $item) {
    /** @phpstan-ignore-next-line */
    $item->doSomething();
}
// 半年后没人知道为什么 ignore
```

### PASS: 标原因

```php
/** @phpstan-ignore method.notFound (动态方法，由 __call 处理，PHPStan 看不到) */
$item->doSomething();
```

### FAIL: 裸 array 返回

```php
public function activeUsers(): array { ... }
// 调用方不知道是 User[] / int[] / 空数组
```

### PASS: 精确类型

```php
/** @return list<User> */
public function activeUsers(): array { ... }
```
