# perl-expert

Perl 开发专家插件，覆盖现代 Perl 5.36+ 开发、Test2 测试工作流，以及 `Edit|Write` 后的语法、调试语句和文件预算守卫。

## 目录结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 与 2 个 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：Perl 开发与 Test2 测试技能文档。
- `tests/`：manifest、dispatch、脚本与文档回归测试。

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

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 验证命令

在仓库根目录执行：

```bash
python3 -m json.tool plugins/perl-expert/hooks/hooks.json >/dev/null
find plugins/perl-expert/hooks plugins/perl-expert/tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test plugins/perl-expert/tests/*.test.mjs
node plugins/perl-expert/hooks/dispatch.mjs post-tool-use/edit-write </dev/null
printf '{not-json' | node plugins/perl-expert/hooks/dispatch.mjs post-tool-use/edit-write
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/perl-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install perl-expert@ai-experts
claude plugin install perl-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall perl-expert
claude plugin uninstall perl-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

运行时依赖：`node` 必需；`perl` 用于 `syntax-perl`。若本机缺少 Perl 解释器，语法守卫会跳过，其他守卫仍可继续工作。
