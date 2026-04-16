---
name: webman-plugin-development
description: 当用户要开发或审查 Webman 插件的 Install.php、config 发布、进程声明或 Bootstrap 时使用。
---

Webman 插件的打包、安装和配置约定。

## 适用场景

- 开发 Composer 分发的 webman 插件。
- 审查第三方插件结构。
- 排查插件配置不生效、进程不启动。

## 核心约束

- `Install.php` 声明 `WEBMAN_PLUGIN = true` 和 `$pathRelation`。见 [reference](reference.md)。
- 配置路径 `src/config/plugin/{vendor}/{package}/`。
- 访问用 `config('plugin.{vendor}.{package}.{key}')`。
- `mkdir` 用 `0755`，`webman-framework` 放 `require-dev`。

## 代码模式

```php
<?php
// src/Install.php 核心常量
final class Install { public const WEBMAN_PLUGIN = true; }
```

## 检查清单

- [ ] `WEBMAN_PLUGIN = true` 已声明
- [ ] `$pathRelation` 指向 `config/plugin/{vendor}/{package}/`
- [ ] PSR-4 autoload 映射到 `src/`
- [ ] `mkdir` 权限 `0755`
- [ ] `uninstall()` 清理已发布配置

## 反模式

- `mkdir 0777` → 安全隐患。
- 读 `config('app.xxx')` → 耦合应用配置。
- `webman-framework` 在 `require` → 无法隔离测试。
- `uninstall()` 留空 → 配置残留。
