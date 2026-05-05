## 代码模式

见 [reference.md](reference.md) 中的 Bundle 类、Extension、services.yaml、CompilerPass 和标签收集完整示例。

## 反模式

### FAIL: Extension 里做运行时调用

```php
public function load(array $configs, ContainerBuilder $container): void {
    $data = (new Client())->get('https://api.example.com/config')->getBody();
    // 容器编译期 HTTP，部署无网络就挂
}
```

### PASS: Extension 只加载配置

```php
public function load(array $configs, ContainerBuilder $container): void {
    $loader = new YamlFileLoader($container, new FileLocator(__DIR__.'/../Resources/config'));
    $loader->load('services.yaml');
}
```

### FAIL: 所有服务 public: true

```yaml
services:
  _defaults: { public: true }  # 破坏自动装配，运行时查找慢
```

### PASS: 默认 private

```yaml
services:
  _defaults: { autowire: true, autoconfigure: true, public: false }
  App\: { resource: '../src/' }
```
