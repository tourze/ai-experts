---
name: perl-testing
description: 当要为 Perl 代码编写或审查测试时使用。
---

# Perl Testing

## 适用场景

- 为 Perl 模块补单元测试、集成测试或回归测试。
- 验证 DBI 交互、文件操作、错误处理路径是否稳定。
- 需要先收紧生产代码结构时，联动 [perl-modern-style](../perl-modern-style/SKILL.md)。

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

### FAIL: 多场景塞进一个 subtest

```perl
use Test::More;

subtest 'user operations' => sub {
    my $u = User->new(name => 'A');
    is $u->name, 'A';
    $u->set_age(30);
    is $u->age, 30;
    ok $u->save;
    # 失败时不知是哪步
};
```

### PASS: 一 subtest 一行为

```perl
use Test::More;

subtest 'new() sets name' => sub {
    is(User->new(name => 'A')->name, 'A');
};
subtest 'set_age() updates age' => sub {
    my $u = User->new(name => 'A');
    $u->set_age(30);
    is($u->age, 30);
};
```

### FAIL: mock 被测模块自身

```perl
my $mock = Test::MockModule->new('OrderService');
$mock->mock(calculate_total => sub { 99 });
# 重构 calculate_total 后测试一团糟
```

### PASS: 只 mock 外部边界

```perl
my $mock = Test::MockModule->new('LWP::UserAgent');
$mock->mock(get => sub { ... });
# 真实 OrderService，假外部 HTTP
```
