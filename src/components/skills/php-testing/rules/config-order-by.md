---
title: 测试执行排序策略
impact: LOW-MEDIUM
impactDescription: 发现隐藏的测试依赖
tags: configuration, ordering, random, depends
---

## 测试执行排序策略

**影响：低-中（发现隐藏的测试依赖）**

在 `phpunit.xml` 中使用 `executionOrder="random"` 随机化测试执行顺序。这会暴露测试间隐藏的依赖——如果测试按字母顺序通过但随机顺序失败，说明它们共享了状态。

结合 `resolveDependencies="true"` 以尊重显式的 `#[Depends]` 属性，同时随机化其他所有测试。

**错误（默认字母顺序）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- 默认顺序——隐藏的依赖不会被发现 -->
</phpunit>
```

**正确（随机顺序并解析依赖）：**

```xml
<!-- phpunit.xml -->
<phpunit
    executionOrder="random"
    resolveDependencies="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

使用特定种子重现失败：
```bash
# PHPUnit 随机化时会显示种子
# 使用相同种子重新运行以重现：
phpunit --order-by=random --random-order-seed=12345
```
