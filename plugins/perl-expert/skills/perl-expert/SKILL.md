---
name: perl-expert
description: 现代 Perl 5.36+ 应用开发和审查，覆盖 Moose/Moo 对象系统、DBI 数据库访问、CPAN 依赖管理、模块组织与常见业务代码模式。
---

# Perl Expert

## 适用场景

- 新建或重构 Perl 5.36+ 模块、CLI 工具或 Web 服务。
- 审查 Moo/Moose 类设计、DBI 用法、错误处理和模块边界。
- 需要补测试时，联动 [perl-testing](../perl-testing/SKILL.md)。

## 核心约束

- `use v5.36;` 启用 strict/warnings/signatures，不再手写三行 preamble。
- 对象系统用 Moo（轻量）或 Moose（功能完整），不手写 `bless`。
- DBI 必须用占位符，绝不拼接 SQL。
- 依赖用 `cpanfile` + `carton`，不全局 `cpanm`。
- 错误用 `croak`/`die` + `try/catch`，不静默返回 `undef`。

## 代码模式

详见 [references/patterns.md](references/patterns.md)。

## 检查清单

- 模块头部是否声明 `use v5.36;`。
- DBI 查询是否全部使用占位符。
- Moo/Moose 属性是否有类型约束和 `required` 标记。
- 错误路径是否被处理，不会静默吞异常。
- 命令是否通过 `carton exec` 运行。

## 反模式

- 数百行逻辑塞进单个 `.pl`，无模块化。
- 字符串拼接 SQL（`"WHERE id = $id"`）。
- 手写 `bless` + getter/setter 而不用 Moo/Moose。
- `eval { ... }; if ($@)` 但不防 `$@` 被覆盖。
- 遗留 `Data::Dumper`、`warn`、`print STDERR` 调试语句。
