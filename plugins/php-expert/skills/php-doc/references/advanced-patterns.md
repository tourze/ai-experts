# PHPDoc 高级模式与反模式

本文件是 php-doc SKILL.md 的拆分内容，包含异常文档模式与反模式的完整代码。

## 代码模式

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
