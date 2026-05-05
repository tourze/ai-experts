## 代码模式

```php
<?php
// src/Install.php 核心常量
final class Install { public const WEBMAN_PLUGIN = true; }
```

## 反模式

### FAIL: mkdir 0777

```php
mkdir($targetDir, 0777, true);
// 任何用户可写 → 攻击者可植入恶意配置
```

### PASS: 0755

```php
mkdir($targetDir, 0755, true);
```

### FAIL: 读应用配置

```php
$dbHost = config('app.db_host');  // 与宿主强耦合
```

### PASS: 插件命名空间

```php
$dbHost = config('plugin.acme.billing.db.host');
// 命名空间隔离，可独立分发
```

### FAIL: uninstall 留空

```php
final class Install {
    public static function uninstall(): void {
        // 未实现清理逻辑，已发布配置与进程声明会残留
    }
}
// composer remove 后配置残留 + process.php 引用残留
```

### PASS: 完整清理

```php
final class Install {
    private static array $pathRelation = [
        'config/plugin/acme/billing/' => 'config/plugin/acme/billing/',
    ];

    public static function uninstall(): void {
        foreach (self::$pathRelation as $src => $dst) {
            $target = base_path() . '/' . $dst;
            if (is_dir($target)) self::removeDir($target);
        }
    }
}
```

### FAIL: framework 在 require

```json
{ "require": { "workerman/webman-framework": "^1.5" } }
// 与宿主版本冲突
```

### PASS: require-dev

```json
{ "require-dev": { "workerman/webman-framework": "^1.5" } }
```
