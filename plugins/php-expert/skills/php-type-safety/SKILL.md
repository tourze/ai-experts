---
name: php-type-safety
description: 当用户要配置 PHPStan 或 Psalm、补 array shapes 和泛型标注、使用条件返回类型、做类型收窄或消除 mixed 时使用。
---

# PHP 类型安全

## 适用场景

- 配置或提升 PHPStan / Psalm 的检查级别。
- 为数组补 `array{key: type}` 结构或 `@template` 泛型标注。
- 用条件返回类型、`@phpstan-assert` 或 `assert()` 做类型收窄。
- 消除代码中的 `mixed`、`@var` 强转和 `@phpstan-ignore` 压制。

## 核心约束

- 目标是 PHPStan level 9 / Psalm level 1；新项目直接拉到最高。
- 数组必须标注元素类型：`array<string, int>`、`list<User>`、`array{id: int, name: string}`。
- `mixed` 只在真正无法确定类型时使用，不作为偷懒手段。
- `@var` 强转是最后手段；优先通过 assert、类型守卫或重构消除。
- `@phpstan-ignore` 每一处都要注释原因，禁止无理由压制。

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

## 检查清单

- PHPStan / Psalm 配置文件存在且级别 ≥ 8。
- 无裸 `array` 参数或返回值——都有结构或元素类型标注。
- 所有 `@phpstan-ignore` 都附带原因注释。
- `mixed` 出现次数持续下降，每次审查都尝试消除。
- 联动：[php-doc](../php-doc/SKILL.md) · [php-8x-features](../php-8x-features/SKILL.md)

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
