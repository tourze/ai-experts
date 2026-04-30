---
name: perl-modern-style
description: 当用户用 Perl 5.36+、Moo/Moose、cpanfile 或 carton 编写模块和管理依赖时使用。
---

# Perl 5.36+ 现代风格

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

### FAIL: 字符串拼接 SQL

```perl
my $rows = $dbh->selectall_arrayref("SELECT * FROM users WHERE id = $id");
# 用户输入 → SQL 注入
```

### PASS: 占位符

```perl
my $rows = $dbh->selectall_arrayref(
    'SELECT * FROM users WHERE id = ?', {}, $id,
);
```

### FAIL: eval + $@ 不保护

```perl
eval { do_something(); };
if ($@) { warn "error: $@"; }   # $@ 可能被 DESTROY 覆盖
```

### PASS: Try::Tiny

```perl
use Try::Tiny;
try { do_something(); }
catch { warn "error: $_"; };
```

### FAIL: 手写 bless

```perl
sub new { my ($c, %a) = @_; bless { %a }, $c }
sub name { $_[0]->{name} }   # 无类型约束
```

### PASS: Moo

```perl
use Moo;
has name => (is => 'ro', required => 1);
has age  => (is => 'ro', isa => sub { die unless $_[0] =~ /^\d+$/ });
```
