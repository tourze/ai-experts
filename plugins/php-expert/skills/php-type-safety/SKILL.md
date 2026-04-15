---
name: php-type-safety
description: 当用户要配置 PHPStan 或 Psalm、补 array shapes 和泛型标注、使用条件返回类型、做类型收窄或消除 mixed 时使用。
license: MIT
metadata:
  version: "1.0.0"
  domain: language
  triggers: PHPStan, Psalm, array shape, generics, template, conditional return, type narrowing, mixed, level 9, phpstan.neon
  role: specialist
  scope: quality
  output-format: code
  related-skills: php-pro, php-doc, php-error-handling, php-testing
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

## 关键模式速查

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
- 联动：[php-doc](../php-doc/SKILL.md) · [php-pro](../php-pro/SKILL.md)

## 反模式

- PHPStan 停留在 level 5 且不敢提升。
- 用 `/** @var User $x */` 强转替代正确的类型收窄。
- 到处 `@phpstan-ignore-next-line` 没有注释原因。
- 泛型集合返回 `array` 而不是 `list<T>` 或 `Collection<T>`。
