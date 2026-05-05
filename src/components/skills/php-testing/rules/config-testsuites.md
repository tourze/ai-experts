---
title: 在命名套件中组织测试
impact: MEDIUM
impactDescription: 按类别选择性执行测试
tags: configuration, testsuites, organization, xml
---

## 在命名套件中组织测试

**影响：中（按类别选择性执行测试）**

在 `phpunit.xml` 中定义命名测试套件，按类型（unit、integration、functional）组织测试。这允许运行特定子集：`phpunit --testsuite unit` 只运行快速的单元测试，非常适合预提交钩子。

为每种套件类型使用独立目录以强制清晰的边界。

**错误（单一测试套件，所有测试一起运行）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="default">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

**正确（按测试类型命名套件）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="functional">
            <directory>tests/Functional</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

用法：
```bash
# 只运行单元测试（快速，用于预提交）
phpunit --testsuite unit

# 运行集成测试
phpunit --testsuite integration

# 运行所有测试
phpunit
```
