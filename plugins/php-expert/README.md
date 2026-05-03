# php-expert

PHP 开发专家能力，覆盖 PHP 代码质量守卫、Composer/PHPStan/PHPUnit 工作流，以及 7 个面向语言特性、设计模式、错误处理、类型安全、异步、生成器内存优化和测试的技能。

## 目录结构

- `hooks/`：9 个运行时守卫脚本。
- `skills/`：7 个技能目录及其参考资料。
- `tests/`：hook 与 SKILL 结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `php-8x-features` | PHP 8.x 语言特性：readonly class、enum、match、交叉类型、DNF、Override |
| `php-design-patterns` | 服务层、Repository、DTO、值对象、DI 纪律、控制器薄化 |
| `php-error-handling` | 异常分层、输入校验边界、错误映射、批量部分失败 |
| `php-generators-memory` | `yield` / `Generator` 流式处理、大数组和大文件内存优化 |
| `php-type-safety` | PHPStan/Psalm 配置、array shapes、泛型、条件返回类型、PHPDoc 规范 |
| `php-async-patterns` | Swoole、ReactPHP、Amphp、原生 Fibers |
| `php-testing` | PHPUnit/Pest 测试结构、属性、数据提供者、Mock 与配置 |

## Agents

| Agent | 用途 |
|-------|------|
| `php-reviewer` | perform a PHP-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-php` | `php -l` 语法检查 |
| PostToolUse Edit\|Write | `syntax-composer` | `composer validate` 校验 |
| PostToolUse Edit\|Write | `lint-phpstan` | PHPStan 静态分析 |
| PostToolUse Edit\|Write | `debug-statement-guard` | `dd()` / `var_dump()` / `print_r()` / `dump()` 检测 |
| PreToolUse Edit\|Write | `protected-paths` | `vendor/`、`composer.lock`、`.phpunit.result.cache` 保护 |
| PreToolUse Bash | `heavy-command-repeat-guard` | `phpunit` / `phpstan` / `pest` / `psalm` 重复执行拦截 |
| PreToolUse Bash | `test-output-truncation-guard` | 测试输出被 `tail/head` 截断时提醒 |
| Stop | `verification-gate` | 完成声明必须伴随测试或静态分析证据 |

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 验证命令

在当前目录执行：

```bash
find hooks tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

