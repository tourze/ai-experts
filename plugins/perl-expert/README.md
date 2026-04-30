# perl-expert

Perl 开发专家能力，覆盖现代 Perl 5.36+ 开发、Test2 测试工作流，以及 `Edit|Write` 后的语法、调试语句和文件预算守卫。

## 目录结构

- `hooks/`：3 个 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：Perl 开发与 Test2 测试技能文档。
- `tests/`：脚本与文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `perl-modern-style` | Perl 5.36+ 约定：use v5.36、Moo/Moose、DBI 占位符、carton 依赖、错误处理 |
| `perl-testing` | Test2::V0 单元测试、prove 工作流、DBI mock 与外部依赖隔离 |

## Agents

| Agent | 用途 |
|-------|------|
| `perl-reviewer` | perform a Perl-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-perl` | 对 `.pl` / `.pm` / `.t` / `.psgi` / `Makefile.PL` / `Build.PL` 执行 `perl -c` |
| PostToolUse Edit\|Write | `debug-statement-guard` | `$DB::single` / `Data::Dumper` / `warn` / `print STDERR` / `Devel::*` 检测 |

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 验证命令

在仓库根目录执行：

```bash
find plugins/perl-expert/hooks plugins/perl-expert/tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test plugins/perl-expert/tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

