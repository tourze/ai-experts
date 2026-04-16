---
name: php-doc
description: 当用户新增、补写或重构 PHPDoc 时使用。适用于为方法、属性、异常、数组泛型、数组结构和条件返回类型补充签名之外的关键信息；当用户只说“补文档”“整理注释”“修正 phpDoc”时也应触发。
---

# PHPDoc 规范

## 适用场景

- 为现有 PHP 代码补写或收敛 `/** */` 文档块。
- 审查 PHPDoc 是否只是重复签名，或是否遗漏了数组结构、异常、业务约束等关键信息。
- 修正 `array<T>`、`list<T>`、`array<string, T>`、数组结构与条件返回类型。
- 在框架代码、DTO、值对象、仓库与服务层中统一文档风格。

## 核心约束

- 默认先判断“是否真的需要文档”，签名已经完整表达意图时直接省略。
- 只记录 PHP 类型系统无法表达的事实：数组元素类型、键约束、单位/范围、前置条件、副作用、异常原因。
- 参数名、返回类型、属性类型已经清晰时，不再重复“用户 ID”“字符串名称”这类无信息量描述。
- 为英文摘要行使用简洁动词短语，例如 `Returns...`、`Creates...`、`Formats...`、`Checks...`。
- `list<T>` 仅用于“从 0 开始且连续的整数键”；如果只知道是数组，不要过度收紧成 `list<T>`。
- `@throws` 描述失败事实，而不是模板句；优先写“为什么会失败”，不要写“Exception thrown when...”。
- 属性文档优先单行 `@var`；只有当用途、兼容性或生命周期不明显时，才补一行说明。

## 代码模式

### 为数组内容和顺序补充信息

```php
<?php

declare(strict_types=1);

namespace App\Catalog;

final class LanguageCatalog
{
    /** @var list<string> */
    private array $supportedLanguages = ['en', 'zh-CN', 'ja'];

    /**
     * Returns supported language codes in UI display order.
     *
     * @return list<string>
     */
    public function supportedLanguages(): array
    {
        return $this->supportedLanguages;
    }
}
```

### 只为非显而易见的行为写文档

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Transaction;

final class TransactionService
{
    /**
     * Creates a transaction and returns null when the caller exceeds the daily limit.
     */
    public function create(float $amountInCents): ?Transaction
    {
        if ($amountInCents > 50_000) {
            return null;
        }

        return new Transaction($amountInCents);
    }
}
```

### 用异常说明失败原因，而不是重复异常类型

```php
<?php

declare(strict_types=1);

namespace App\Import;

use RuntimeException;

final class CsvImporter
{
    /**
     * Imports user rows from a UTF-8 CSV file.
     *
     * @throws RuntimeException Source file does not exist.
     * @throws RuntimeException File contents are not valid UTF-8 CSV data.
     */
    public function import(string $path): void
    {
        if ($path === '') {
            throw new RuntimeException('Source file does not exist.');
        }
    }
}
```

## 检查清单

- 每个文档块都回答了“签名之外新增了什么信息”。
- `@return`、`@param`、`@var` 的泛型/数组结构与实现一致，没有把普通数组误写成 `list<T>`。
- 删除了 getter、setter、简单委托、显式类型属性上的冗余 PHPDoc。
- `@throws` 描述的是失败条件，而不是异常类名的同义反复。
- 文档与代码一起改动；签名变化后同步清理陈旧注释。
- 联动：[php-8x-features](../php-8x-features/SKILL.md) · [php-design-patterns](../php-design-patterns/SKILL.md) · [php-type-safety](../php-type-safety/SKILL.md) · [php-testing](../php-testing/SKILL.md)

## 反模式

### FAIL: 重复签名

```php
/**
 * @param string $email 邮箱
 * @return User 用户
 */
public function findByEmail(string $email): User { ... }
// 签名已说明，doc 是噪音
```

### PASS: 仅写签名外的事

```php
/**
 * Throws when email format is invalid before DB lookup.
 *
 * @throws InvalidArgumentException Email failed RFC 5322 validation.
 */
public function findByEmail(string $email): User { ... }
```

### FAIL: 任意数组标 list

```php
/** @return list<User> */
public function findActive(): array {
    $result = [];
    foreach ($users as $u) {
        if ($u->active) $result[$u->id] = $u;  // 键是 id 不是 0,1,2
    }
    return $result;  // 实际是 array<int, User>
}
// 调用方 array_values($x) 才能用，PHPStan 报错
```

### PASS: 准确类型

```php
/** @return array<int, User> */  // 键是 user id
// 或如果要返回 list：return array_values($result);
```
