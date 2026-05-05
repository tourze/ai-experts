## 核心约束

- 只有调用方能顺序消费数据、且不需要随机访问或多次遍历时，才用 `yield` 替代数组。
- 含 `yield` 的函数被调用时返回 `\Generator` 对象；函数体到迭代开始才执行。不要把它当成普通返回值直接输出或传给只接受数组的 API。
- 不要在下游立刻 `iterator_to_array()`，除非数据量有明确上界；这会把内存优势重新吃掉。
- 持有文件句柄、游标、锁或网络连接的生成器必须用 `try` / `finally` 清理资源，兼容调用方提前 `break`。
- `return` 在生成器里表示最终返回值，只能通过 `Generator::getReturn()` 读取，不会成为 `foreach` 的元素。
- 对外 API 优先标注 `iterable` 表达消费契约；需要暴露 `send()`、`throw()`、`getReturn()` 等生成器能力时才返回 `\Generator`。
- 与 ORM 大批量写入、`flush()` / `clear()`、事务边界相关的问题，优先交给对应框架的批处理 skill，不在语言层硬套生成器。

## 代码模式

### 大文件逐行读取

```php
<?php

declare(strict_types=1);

/**
 * @return \Generator<int, string>
 */
function readLines(string $path): \Generator
{
    $handle = fopen($path, 'rb');
    if ($handle === false) {
        throw new \RuntimeException("Cannot open file: {$path}");
    }

    try {
        $lineNumber = 0;
        while (($line = fgets($handle)) !== false) {
            yield ++$lineNumber => rtrim($line, "\r\n");
        }
    } finally {
        fclose($handle);
    }
}
```

### 分页数据流式展开

```php
<?php

declare(strict_types=1);

/**
 * @return list<int>
 */
function fetchUserIdsPage(int $page): array
{
    return $page > 3 ? [] : [($page - 1) * 2 + 1, ($page - 1) * 2 + 2];
}

/**
 * @return \Generator<int, int>
 */
function streamUserIds(): \Generator
{
    for ($page = 1; ; ++$page) {
        $ids = fetchUserIdsPage($page);
        if ($ids === []) {
            return;
        }

        yield from $ids;
    }
}
```

### 生成器最终返回值

```php
<?php

declare(strict_types=1);

/**
 * @return \Generator<int, int, void, int>
 */
function countImportedRows(array $rows): \Generator
{
    $count = 0;
    foreach ($rows as $row) {
        ++$count;
        yield $count => (int) $row;
    }

    return $count;
}

$imported = countImportedRows(['10', '20']);
foreach ($imported as $rowNumber => $rowId) {
    echo "{$rowNumber}:{$rowId}\n";
}
echo $imported->getReturn();
```

来源材料：[知乎专栏：在 PHP 中使用 `yield` 来做内存优化](https://zhuanlan.zhihu.com/p/34531081)、[PHP Manual: Generators overview](https://www.php.net/manual/en/language.generators.overview.php)、[PHP Manual: Generator syntax](https://www.php.net/manual/en/language.generators.syntax.php)。

## 检查清单

- 当前内存问题是否来自全量数组、`file()` / `range()` / `fetchAll()`、或上游 API 一次性返回。
- 调用方是否只需要单次顺序遍历；如果需要排序、分页跳转、随机访问或重复遍历，数组或专用集合可能更清晰。
- 生成器内部是否避免累积无界状态，例如 `$items[] = ...`、缓存全部中间结果、拼接超大字符串。
- 是否有 `try` / `finally` 释放文件句柄、数据库游标、锁或外部连接。
- 是否保留了键名语义：需要定位来源行、页码、业务 ID 时使用 `yield $key => $value`。
- 是否用 `memory_get_peak_usage()` 或等价 profiling 在目标数据量上验证，而不是只凭代码观感判断。
- PHPDoc 是否表达元素类型，例如 `\Generator<int, User>` 或 `iterable<User>`，避免静态分析退回 `mixed`。

## 反模式

### FAIL: 先组大数组再返回

```php
<?php

declare(strict_types=1);

function buildIds(int $limit): array
{
    $ids = [];
    for ($id = 1; $id <= $limit; ++$id) {
        $ids[] = $id;
    }

    return $ids;
}
```

### PASS: 边生成边消费

```php
<?php

declare(strict_types=1);

/**
 * @return \Generator<int, int>
 */
function streamIds(int $limit): \Generator
{
    for ($id = 1; $id <= $limit; ++$id) {
        yield $id;
    }
}
```

### FAIL: 立刻转回数组

```php
<?php

declare(strict_types=1);

$ids = iterator_to_array(streamIds(1_000_000));
foreach ($ids as $id) {
    echo $id;
}
```

### PASS: 下游保持流式处理

```php
<?php

declare(strict_types=1);

foreach (streamIds(1_000_000) as $id) {
    echo $id;
}
```
