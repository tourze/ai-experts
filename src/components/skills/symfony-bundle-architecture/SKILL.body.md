## 核心约束

- Bundle 类只做：声明依赖 + 注册 CompilerPass。
- Extension `load()` 只加载配置文件，不直接构造服务。
- services.yaml 用 `autowire` + `autoconfigure` + 按命名空间 `resource` 扫描；禁用 `exclude`。
- CompilerPass 仅用于标签和配置无法完成的操作，必须 `hasDefinition()` 前置检查。
- Bundle 间依赖必须显式声明，不靠加载顺序。

## 代码模式

见 [reference.md](reference.md) 中的 Bundle 类、Extension、services.yaml、CompilerPass 和标签收集完整示例。

## 检查清单

- Bundle 类是否只含 `build()` 和依赖声明。
- Extension 是否通过 FileLocator + Loader 加载配置。
- services.yaml 是否按命名空间分组 `resource`。
- CompilerPass 是否做了存在性前置检查。
- Bundle 间依赖是否显式声明，可选依赖是否有降级。

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
