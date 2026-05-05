# php-expert

PHP 开发专家能力，覆盖 PHP 代码质量守卫、Composer/PHPStan/PHPUnit 工作流，以及 7 个面向语言特性、设计模式、错误处理、类型安全、异步、生成器内存优化和测试的技能。

## 目录结构

- `hooks/`：9 个运行时守卫脚本。
- `skills/`：7 个技能目录及其参考资料。
- `tests/`：hook 与 SKILL 结构的最小回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `doctrine-batch-processing` | 当用户要实现或修复 Symfony / Doctrine 批处理、批量导入、数据回填或大数据量写入时使用。 |
| `doctrine-entity-patterns` | 当用户要设计或审查 Doctrine ORM Entity、关联关系、Repository 或 Migration 时使用。 |
| `laravel-patterns` | 当用户需要处理 Laravel 分层架构、Service/Action 边界、Eloquent 模型、Migration、FormRequest、JsonResource、Job、Livewire、scopeBindings、多租户路由或 N+1 问题时使用。 |
| `laravel-security` | 当用户提到 Laravel 安全、Sanctum、Policy、FormRequest、文件上传安全、CORS、安全头或密钥管理时使用。 |
| `laravel-tdd` | 当用户提到 Laravel 测试、Pest、PHPUnit、RefreshDatabase、Queue::fake 或 HTTP fake 时使用。 |
| `laravel-verification` | 当用户提到 Laravel 自检、发版前检查、CI 流水线、composer audit、phpstan、pint 或 migrate --pretend 时使用。 |
| `php-8x-features` | PHP 8.x 语言特性：readonly class、enum、match、交叉类型、DNF、Override |
| `php-async-patterns` | Swoole、ReactPHP、Amphp、原生 Fibers |
| `php-design-patterns` | 服务层、Repository、DTO、值对象、DI 纪律、控制器薄化 |
| `php-error-handling` | 异常分层、输入校验边界、错误映射、批量部分失败 |
| `php-generators-memory` | `yield` / `Generator` 流式处理、大数组和大文件内存优化 |
| `php-testing` | PHPUnit/Pest 测试结构、属性、数据提供者、Mock 与配置 |
| `php-type-safety` | PHPStan/Psalm 配置、array shapes、泛型、条件返回类型、PHPDoc 规范 |
| `symfony-bundle-architecture` | 当用户要设计或审查 Symfony Bundle 的目录结构、DI Extension、CompilerPass 或 Bundle 间依赖时使用。 |
| `symfony-messenger` | 当用户要设计或修复 Symfony Messenger 异步消息处理、重试、失败队列或消费者时使用。 |
| `symfony-ux` | 当用户要在 Symfony 项目中选择 Stimulus、Turbo、UX 套件、前端交互方案、异步片段刷新或组件组合策略时使用。 |
| `symfony-voters` | 当用户要设计或修复 Symfony Voter 授权逻辑、IsGranted 属性或权限决策矩阵时使用。 |
| `twig-components` | 当用户要抽取 Twig 视图片段、实现 TwigComponent、LiveComponent 状态、props、表单联动或模板复用时使用。 |
| `webman-custom-processes` | 当用户要声明或排查 Webman 自定义进程、Timer、Crontab 或 crash-restart 时使用。 |
| `webman-naming-conventions` | 当用户要统一或审查 Webman 项目的目录命名、接口后缀、Service 命名或命名空间时使用。 |
| `webman-plugin-development` | 当用户要开发或审查 Webman 插件的 Install.php、config 发布、进程声明或 Bootstrap 时使用。 |
| `webman-websocket-patterns` | 当用户要在 Webman 中搭建或排查 WebSocket 服务端、心跳、频道广播或客户端重连时使用。 |

## Agents

| Agent | 用途 |
|-------|------|
| `laravel-engineer` | 当需要端到端设计或实现 Laravel 项目时使用——覆盖分层架构、Eloquent ORM、FormRequest 校验、Policy/Gate 授权、Queue/Job 异步、Migration 管理与 TDD 测试策略。 |
| `laravel-reviewer` | 当需要只读审查 Laravel 分层、Eloquent、Validation、Authorization、Migration 和 Queue 时使用。 |
| `php-reviewer` | perform a PHP-specific code review |
| `symfony-engineer` | 当需要端到端设计或实现 Symfony 项目时使用——覆盖 Bundle 架构、Doctrine ORM、Messenger 异步消息、Security/Voter 授权、Twig/UX 前端与批处理优化。 |
| `symfony-reviewer` | 当需要只读审查 Symfony DI、Service、Doctrine、Messenger、Event、Security/Voter 和 Twig/UX 时使用。 |
| `webman-reviewer` | 当需要只读审查 Webman 命名规范、自定义进程、WebSocket、插件机制以及 worker 长生命周期风险时使用。 |

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

