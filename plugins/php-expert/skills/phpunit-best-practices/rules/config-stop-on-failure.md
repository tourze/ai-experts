---
title: 首次失败即停止以快速反馈
impact: LOW
impactDescription: 开发期间即时反馈
tags: configuration, stop-on-failure, feedback, workflow
---

## 首次失败即停止以快速反馈

**影响：低（开发期间即时反馈）**

开发期间使用 `stopOnFailure="true"` 在首次失败时停止测试套件。这提供即时反馈，而非等待数百个测试完成后才看到错误。

在 CI 中禁用此设置，因为你需要所有失败的完整报告。

**错误（开发期间等待完整套件运行）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- 即使第一个测试失败也运行所有 500 个测试 -->
</phpunit>
```

**正确（开发时首次失败即停止）：**

```xml
<!-- phpunit.xml.dist — 共享配置 -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

```xml
<!-- phpunit.xml — 本地开发覆盖（加入 gitignore） -->
<phpunit
    stopOnFailure="true"
    stopOnError="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

或使用 CLI 标志而不修改配置：
```bash
phpunit --stop-on-failure
```
