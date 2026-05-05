---
title: 覆盖率分析的源目录
impact: MEDIUM
impactDescription: 精确的生产代码覆盖率报告
tags: configuration, coverage, source, filter
---

## 覆盖率分析的源目录

**影响：中（精确的生产代码覆盖率报告）**

在 `phpunit.xml` 中配置 `<source>` 元素，指定哪些目录包含用于覆盖率分析的生产代码。没有此配置，PHPUnit 要么不计量任何内容，要么在覆盖率报告中包含测试文件和 vendor 代码。

**错误（无 source 配置）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- 无 source 配置——覆盖率报告为空或不准确 -->
</phpunit>
```

**正确（配置了源目录）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>src</directory>
        </include>
        <exclude>
            <directory>src/Kernel.php</directory>
            <directory>src/DataFixtures</directory>
        </exclude>
    </source>
</phpunit>
```

运行覆盖率：
```bash
phpunit --coverage-text
phpunit --coverage-html coverage/
```

参考：[PHPUnit Source Configuration](https://docs.phpunit.de/en/11.5/configuration.html#the-source-element)
