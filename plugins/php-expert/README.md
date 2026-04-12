# php-expert

PHP 开发专家插件，提供语法检查、静态分析、调试语句检测、测试最佳实践等全方位 PHP 开发守护。

## Skills

| Skill | 用途 |
|-------|------|
| `php-doc` | PHPDoc 注释规范（Nette 风格） |
| `php-pro` | 现代 PHP 8.3+ 特性、设计模式、异步编程 |
| `phpunit-best-practices` | PHPUnit 测试最佳实践（40+ 规则） |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-php` | `php -l` 语法检查 |
| PostToolUse Edit\|Write | `syntax-composer` | `composer validate` 校验 |
| PostToolUse Edit\|Write | `lint-phpstan` | PHPStan 静态分析 |
| PostToolUse Edit\|Write | `debug-statement-guard` | dd/var_dump/print_r/dump 检测 |
| PostToolUse Edit\|Write | `encoding-guard` | PHP 文件编码检查 |
| PostToolUse Edit\|Write | `file-budget-guard` | PHP 文件行数预算（500 行） |
| PreToolUse Edit\|Write | `protected-paths` | vendor/、composer.lock 保护 |
| PreToolUse Bash | `heavy-command-repeat-guard` | phpunit/phpstan 重复执行拦截 |
| PreToolUse Bash | `test-output-truncation-guard` | 测试输出截断检测 |
| Stop | `verification-gate` | 完成声明必须附带验证证据 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/php-expert
```
