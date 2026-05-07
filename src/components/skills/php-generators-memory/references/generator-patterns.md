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
