---
title: 缓存目录提升性能
impact: LOW
impactDescription: 加快后续测试运行
tags: configuration, cache, performance, baseline
---

## 缓存目录提升性能

**影响：低（加快后续测试运行）**

在 `phpunit.xml` 中配置缓存目录，使 PHPUnit 能够缓存测试结果、覆盖率数据和基线信息。这加快了后续运行速度，特别是使用 `--order-by=defects` 时会优先重新运行失败的测试。

将缓存目录添加到 `.gitignore`。

**错误（无缓存目录）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- 无缓存——每次运行都从头开始 -->
</phpunit>
```

**正确（配置了缓存目录）：**

```xml
<!-- phpunit.xml -->
<phpunit
    cacheDirectory=".phpunit.cache"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

```gitignore
# .gitignore
.phpunit.cache/
```

好处：
- `--order-by=defects` 优先重新运行失败的测试（需要缓存）
- 覆盖率缓存避免对未更改文件重新注入
- 变异测试的基线比较

参考：[PHPUnit Cache Configuration](https://docs.phpunit.de/en/11.5/configuration.html#the-cache-directory-attribute)
