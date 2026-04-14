---
name: laravel-verification
description: Laravel 发布前验证技能。用于执行格式化、静态分析、测试、依赖审计、迁移检查、缓存预热和队列调度自检；当用户提到 Laravel 自检、发版前检查、CI 流水线、composer audit、phpstan、pint 或 migrate --pretend 时启用。
---

# Laravel 验证循环

## 适用场景

- 提交 PR 前、重构后、依赖升级后、预发布前需要跑一套完整的 Laravel 验证。
- 需要把“本地能跑”提升为“格式、静态分析、测试、迁移和运行时配置都过关”。
- 需要把验证命令落到 CI 或交接文档中。
- 代码级实现和安全基线分别参考 [laravel-specialist](../laravel-specialist/SKILL.md) 与 [laravel-security](../laravel-security/SKILL.md)。

## 核心约束

- 环境检查是第一关：PHP、Composer、Artisan、`.env` 与数据库连接不对时，后续命令没有意义。
- 格式化和静态分析先于全量测试；测试先于迁移与部署缓存。
- 迁移检查不仅看 `up()`，还要看 `down()`、幂等性、命名和破坏性变更。
- 缓存预热、调度器、队列工作者属于运行时契约，不能只在 README 里假定它们存在。
- 任何一步失败都必须阻断“准备发布”的结论，不能用手工解释覆盖掉红灯。

## 代码模式

```bash
php -v
composer --version
php artisan --version
composer validate
composer dump-autoload -o
vendor/bin/pint --test
vendor/bin/phpstan analyse
php artisan test
composer audit
php artisan migrate --pretend
php artisan migrate:status
```

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan schedule:list
php artisan queue:failed
php artisan horizon:status
```

## 检查清单

- 确认 PHP、Composer、Artisan 和 `.env` 与目标环境一致，`APP_DEBUG` 在生产为 `false`。
- `pint`、`phpstan` / `psalm`、测试、`composer audit` 全部通过后再看迁移与缓存命令。
- 审查迁移文件名、破坏性 SQL、`down()` 回滚路径和是否需要灰度步骤。
- 运行缓存预热后确认没有闭包路由、环境变量缺失或不可写目录问题。
- 检查调度器、队列、Horizon、失败作业和健康检查队列是否符合目标环境配置。

## 反模式

- 跳过静态分析，直接拿“测试通过”当发布凭证。
- 只跑 `php artisan test`，完全不看 `composer audit` 和迁移副作用。
- 在本地开发环境成功后，默认线上缓存、调度器和队列也会一样工作。
- 把 `migrate --pretend` 当成数据库变更的全部审查手段。
- 出现红灯时用“这次先发”掩盖环境、迁移或安全问题。
