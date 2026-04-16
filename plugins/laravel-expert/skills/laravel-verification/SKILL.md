---
name: laravel-verification
description: 当用户提到 Laravel 自检、发版前检查、CI 流水线、composer audit、phpstan、pint 或 migrate --pretend 时使用。
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

### FAIL: 只跑测试就认为 OK

```bash
php artisan test  # 全绿
# 没跑 phpstan、没看 composer audit、没看 migrate --pretend
# 结果：线上类型错误、已知漏洞依赖、迁移锁表
```

### PASS: 全链路验证

```bash
vendor/bin/pint --test          # 格式
vendor/bin/phpstan analyse      # 静态分析
php artisan test                # 测试
composer audit                  # 依赖漏洞
php artisan migrate --pretend   # 迁移 SQL 审查
```

### FAIL: 本地成功 = 线上可行

```
本地 cache:clear 后跑通了 → 直接部署
→ 生产闭包路由无法缓存导致 route:cache 报错
```

### PASS: 预发复现线上配置

```bash
APP_ENV=production php artisan config:cache
APP_ENV=production php artisan route:cache  # 线上等价命令
APP_ENV=production php artisan view:cache
# 所有缓存命令跑通 → 才能进部署流程
```
