# php-expert

PHP 开发专家插件，覆盖 PHP 代码质量守卫、Composer/PHPStan/PHPUnit 工作流，以及 3 个面向实现/文档/测试的技能。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 10 个运行时守卫脚本。
- `skills/`：`php-doc`、`php-pro`、`phpunit-best-practices` 三个技能及其参考资料。
- `tests/`：manifest、dispatch、hook 与 SKILL 结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `php-doc` | PHPDoc 取舍、数组泛型、异常文档与注释收敛 |
| `php-pro` | 现代 PHP 8.3+ / Laravel / Symfony 实现约束与工程模式 |
| `phpunit-best-practices` | PHPUnit 测试结构、属性、数据提供者、Mock 与配置规范 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-php` | `php -l` 语法检查 |
| PostToolUse Edit\|Write | `syntax-composer` | `composer validate` 校验 |
| PostToolUse Edit\|Write | `lint-phpstan` | PHPStan 静态分析 |
| PostToolUse Edit\|Write | `debug-statement-guard` | `dd()` / `var_dump()` / `print_r()` / `dump()` 检测 |
| PostToolUse Edit\|Write | `encoding-guard` | PHP / Composer / 配置文件 BOM 与非 UTF-8 编码提醒 |
| PostToolUse Edit\|Write | `file-budget-guard` | PHP 文件行数预算（500 行） |
| PreToolUse Edit\|Write | `protected-paths` | `vendor/`、`composer.lock`、`.phpunit.result.cache` 保护 |
| PreToolUse Bash | `heavy-command-repeat-guard` | `phpunit` / `phpstan` / `pest` / `psalm` 重复执行拦截 |
| PreToolUse Bash | `test-output-truncation-guard` | 测试输出被 `tail/head` 截断时提醒 |
| Stop | `verification-gate` | 完成声明必须伴随测试或静态分析证据 |

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
