# php-expert

PHP 开发专家插件，覆盖 PHP 代码质量守卫、Composer/PHPStan/PHPUnit 工作流，以及 7 个面向语言特性、设计模式、错误处理、类型安全、异步、文档和测试的技能。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 9 个运行时守卫脚本。
- `skills/`：7 个技能目录及其参考资料。
- `tests/`：manifest、dispatch、hook 与 SKILL 结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `php-pro` | PHP 8.3+ 语言特性：strict_types、readonly、枚举、match、交叉类型 |
| `php-design-patterns` | 服务层、Repository、DTO、值对象、DI 纪律、控制器薄化 |
| `php-error-handling` | 异常分层、输入校验边界、错误映射、批量部分失败 |
| `php-type-safety` | PHPStan/Psalm 配置、array shapes、泛型、条件返回类型 |
| `php-async-patterns` | Swoole、ReactPHP、Amphp、原生 Fibers |
| `php-doc` | PHPDoc 取舍、数组泛型、异常文档与注释收敛 |
| `php-testing` | PHPUnit/Pest 测试结构、属性、数据提供者、Mock 与配置 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-php` | `php -l` 语法检查 |
| PostToolUse Edit\|Write | `syntax-composer` | `composer validate` 校验 |
| PostToolUse Edit\|Write | `lint-phpstan` | PHPStan 静态分析 |
| PostToolUse Edit\|Write | `debug-statement-guard` | `dd()` / `var_dump()` / `print_r()` / `dump()` 检测 |
| PostToolUse Edit\|Write | `file-budget-guard` | PHP 文件行数预算（500 行） |
| PreToolUse Edit\|Write | `protected-paths` | `vendor/`、`composer.lock`、`.phpunit.result.cache` 保护 |
| PreToolUse Bash | `heavy-command-repeat-guard` | `phpunit` / `phpstan` / `pest` / `psalm` 重复执行拦截 |
| PreToolUse Bash | `test-output-truncation-guard` | 测试输出被 `tail/head` 截断时提醒 |
| Stop | `verification-gate` | 完成声明必须伴随测试或静态分析证据 |

如需通用 BOM / UTF-8 编码检查，请叠加安装 [coding-expert](../coding-expert/README.md)。

## 验证命令

在插件目录执行：

```bash
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
node hooks/dispatch.mjs post-tool-use/edit-write </dev/null
printf '{not-json' | node hooks/dispatch.mjs post-tool-use/edit-write
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/php-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install php-expert@ai-experts
claude plugin install php-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall php-expert
claude plugin uninstall php-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

运行时依赖：`node` 必需；`php`、`composer`、`vendor/bin/phpstan` 按需启用。缺少对应工具时，相关 hook 会自动降级为静默跳过或仅保留本地检查。
