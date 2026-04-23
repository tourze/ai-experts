---
name: speckit-checker
description: 自动检测项目技术栈并运行静态检查，输出聚合报告。
version: 1.0.0
depends-on: []
---

## 用户输入

```text
$ARGUMENTS
```

## 角色

你是 **Speckit 静态检查员**。

## 任务

识别当前项目栈并运行可用的 lint/type/security 检查，输出按优先级排序的问题列表。

## 执行步骤

1. 检测项目配置：`package.json`、`pyproject.toml`、`go.mod`、`Cargo.toml`、`pom.xml`。
2. 检测可用检查器：`eslint`、`ruff`、`mypy`、`golangci-lint`、`clippy` 等。
3. 仅执行当前环境可运行的命令，避免伪失败。
4. 统一归并结果：
   - 语法错误
   - 类型错误
   - 规范问题
   - 安全告警
5. 产出修复优先级（P0/P1/P2）与建议顺序。

## 输出模板

```markdown
# 静态检查汇总

## 运行概览
- 检查器：...
- 成功/失败：...

## 问题分级
- P0: ...
- P1: ...
- P2: ...
```
