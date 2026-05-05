## 核心约束

- 目标是 PHPStan level 9 / Psalm level 1；新项目直接拉到最高。
- 数组必须标注元素类型：`array<string, int>`、`list<User>`、`array{id: int, name: string}`。
- `mixed` 只在真正无法确定类型时使用，不作为偷懒手段。
- `@var` 强转是最后手段；优先通过 assert、类型守卫或重构消除。
- `@phpstan-ignore` 每一处都要注释原因，禁止无理由压制。
- PHPDoc 默认先判断"是否真的需要"：签名已完整表达意图时省略。
- 只记录类型系统无法表达的事实：数组元素类型、键约束、单位/范围、前置条件、副作用、异常原因。
- `@throws` 描述失败事实而不是模板句；优先写"为什么会失败"。
- `list<T>` 仅用于从 0 开始且连续的整数键，不任意收紧。

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

## 检查清单

- PHPStan / Psalm 配置文件存在且级别 ≥ 8。
- 无裸 `array` 参数或返回值——都有结构或元素类型标注。
- 所有 `@phpstan-ignore` 都附带原因注释。
- `mixed` 出现次数持续下降，每次审查都尝试消除。
- 每个文档块都回答了"签名之外新增了什么信息"，删除冗余 PHPDoc。
- 泛型/数组结构与实现一致，没有把普通数组误写成 `list<T>`。
- 签名变化后同步清理陈旧注释。
- 联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-design-patterns](../php-design-patterns/SKILL.md) · [php-testing](../php-testing/SKILL.md)

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
