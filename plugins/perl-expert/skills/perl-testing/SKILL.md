---
name: perl-testing
description: 使用 Test2::V0 和 prove 为 Perl 代码编写可靠测试，覆盖单元测试、模块测试、DBI mock 与 CPAN 发行前检查。
---

# Perl Testing

## 适用场景

- 为 Perl 模块补单元测试、集成测试或回归测试。
- 验证 DBI 交互、文件操作、错误处理路径是否稳定。
- 需要先收紧生产代码结构时，联动 [perl-expert](../perl-expert/SKILL.md)。

## 核心约束

- 优先 `Test2::V0`，兼容 `Test::More` 且功能更强。
- 测试放 `t/`，后缀 `.t`，用 `prove -lr t/` 运行。
- 每个 `subtest` 只验证一个行为，标题写明触发条件和预期。
- 只 mock 外部边界（DBI、LWP、文件系统），不 mock 被测核心逻辑。

## 代码模式

详见 [references/patterns.md](references/patterns.md)。

## 检查清单

- subtest 标题是否能说明失败影响，无 `works`、`test 1` 空洞命名。
- 是否覆盖成功、失败和关键边界，不只测 happy path。
- 断言是否具体（`is`、`like`、`is_deeply`），不只用 `ok`。
- 测试文件是否可独立运行，不依赖全局顺序。

## 反模式

- 多个场景塞进一个 subtest，失败后无法定位回归。
- mock 被测模块自身方法，让测试和实现一起变脆。
- 测试文件超 300 行，说明被测模块职责过多。
- 遗留 `Data::Dumper`、`warn` 调试输出。
