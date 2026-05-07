# Webman 插件开发参考

## 影响程度

**高**

## 问题

插件不遵循 webman 目录约定，导致配置不自动加载、进程不启动、中间件不注册，或安装/卸载后留下残留文件。

## 为什么重要

- webman 框架通过扫描 `config/plugin/` 目录自动加载插件配置。不遵循路径约定的配置不会被发现。
- `Install.php` 中 `WEBMAN_PLUGIN = true` 是 webman 识别插件的标记常量，缺少它安装流程不会触发。
- `$pathRelation` 定义了哪些文件从插件包复制到应用目录，映射错误会导致配置加载失败。
- `uninstall()` 不清理会导致卸载后 webman 仍尝试加载已移除的类，触发自动加载致命错误。

## 标准目录结构

```
vendor-name/package-name/
  composer.json
  src/
    Install.php
    YourService.php
    Process/
      YourWorker.php
    config/
      plugin/
        vendor-name/
          package-name/
            app.php          # 主配置（enable 开关、业务参数）
            process.php      # 自定义进程声明
            bootstrap.php    # 启动类列表
            middleware.php   # 中间件声明
            route.php        # 路由定义
            log.php          # Monolog 日志通道
            redis.php        # Redis 连接（如需独立连接）
```

## Install.php 完整模板

```php
<?php

declare(strict_types=1);

namespace VendorName\PackageName;

final class Install
{
    public const WEBMAN_PLUGIN = true;

    /** @var array<string, string> 源路径 => 目标路径 */
    protected static array $pathRelation = [
        'config/plugin/vendor-name/package-name' => 'config/plugin/vendor-name/package-name',
    ];

    public static function install(): void
    {
        static::installByRelation();
    }

    public static function uninstall(): void
    {
        self::uninstallByRelation();
    }

    public static function installByRelation(): void
    {
        foreach (static::$pathRelation as $source => $dest) {
            $sourceDir = __DIR__ . "/$source";
            $destDir = base_path() . "/$dest";

            if ($pos = strrpos($dest, '/')) {
                $parentDir = base_path() . '/' . substr($dest, 0, $pos);
                if (!is_dir($parentDir)) {
                    mkdir($parentDir, 0755, true);
                }
            }

            copy_dir($sourceDir, $destDir);
        }
    }

    public static function uninstallByRelation(): void
    {
        foreach (static::$pathRelation as $source => $dest) {
            $destDir = base_path() . "/$dest";
            if (is_dir($destDir)) {
                remove_dir($destDir);
            }
        }
    }
}
```

## 配置文件示例

主配置（`app.php`）：

```php
<?php

declare(strict_types=1);

return [
    'enable'  => true,
    'timeout' => 30,
    'retry'   => 3,
];
```

进程声明（`process.php`）：

```php
<?php

declare(strict_types=1);

use VendorName\PackageName\Process\YourWorker;

return [
    'your-worker' => [
        'handler' => YourWorker::class,
        'count'   => 1,
    ],
];
```

Bootstrap（`bootstrap.php`）：

```php
<?php

declare(strict_types=1);

return [
    \VendorName\PackageName\YourBootstrap::class,
];
```

中间件（`middleware.php`）：

```php
<?php

declare(strict_types=1);

return [
    '' => [
        \VendorName\PackageName\Middleware\YourMiddleware::class,
    ],
];
```

## 插件内读取自身配置

```php
<?php

declare(strict_types=1);

namespace VendorName\PackageName;

final class YourService
{
    public function getTimeout(): int
    {
        return (int) config('plugin.vendor-name.package-name.app.timeout', 30);
    }
}
```

## composer.json 关键配置

```json
{
    "name": "vendor-name/package-name",
    "type": "library",
    "autoload": {
        "psr-4": {
            "VendorName\\PackageName\\": "src/"
        }
    },
    "require": {
        "php": ">=8.1"
    },
    "require-dev": {
        "workerman/webman-framework": "^2.0"
    }
}
```

要点：
- `webman-framework` 放在 `require-dev`，允许独立运行测试。
- PSR-4 映射到 `src/`。
- `type` 使用 `library`，不需要特殊 Composer 插件类型。

## Bootstrap 接口

```php
<?php

declare(strict_types=1);

namespace VendorName\PackageName;

use Workerman\Worker;

final class YourBootstrap implements \Webman\Bootstrap
{
    public static function start(?Worker $worker): void
    {
        // 每个 Worker 进程启动时执行
        // $worker 为 null 表示主进程
    }
}
```

## 启用/禁用检查

插件应在关键入口检查 `enable` 配置：

```php
<?php

declare(strict_types=1);

namespace VendorName\PackageName\Process;

use Workerman\Worker;

final class YourWorker
{
    public function onWorkerStart(Worker $worker): void
    {
        if (!config('plugin.vendor-name.package-name.app.enable', false)) {
            Worker::stopAll();
            return;
        }

        // 正常初始化
    }
}
```

## 检测

**代码审查清单**

- [ ] `Install.php` 是否声明了 `WEBMAN_PLUGIN = true`？
- [ ] `$pathRelation` 的源路径是否相对于 `Install.php` 所在目录正确？
- [ ] 目标路径是否严格遵循 `config/plugin/{vendor}/{package}/` 格式？
- [ ] `mkdir` 权限是否为 `0755`？
- [ ] `uninstall()` 是否调用了 `remove_dir()` 清理已发布的配置？
- [ ] `composer.json` 中 `webman-framework` 是否在 `require-dev`？
- [ ] 插件代码是否通过 `config('plugin.xxx')` 读取自身配置？
- [ ] 进程 handler 类是否使用完全限定类名（含命名空间）？
