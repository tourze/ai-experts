# Symfony Bundle Architecture 参考

## 标准目录结构

```
src/
├── {BundleName}Bundle.php
├── DependencyInjection/
│   ├── {BundleName}Extension.php
│   ├── Configuration.php           # 可选：语义化配置
│   └── Compiler/
├── Resources/config/
│   ├── services.yaml
│   ├── services_dev.yaml           # 可选
│   └── services_test.yaml          # 可选
├── Controller/
├── Command/
├── Service/
├── Entity/
├── Repository/
├── EventListener/
├── Attribute/
└── Migrations/
```

## Bundle 类

```php
<?php

namespace App\ServerNodeBundle;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

final class ServerNodeBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);
        $container->addCompilerPass(new DependencyInjection\Compiler\RemoveOptionalAdminPass());
    }

    /** @return array<class-string<Bundle>> */
    public static function getBundleDependencies(): array
    {
        return [
            \Doctrine\Bundle\DoctrineBundle\DoctrineBundle::class,
            \Doctrine\Bundle\MigrationsBundle\DoctrineMigrationsBundle::class,
        ];
    }
}
```

## Extension

```php
<?php

namespace App\ServerNodeBundle\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

final class ServerNodeExtension extends Extension
{
    public function load(array $configs, ContainerBuilder $container): void
    {
        $loader = new YamlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('services.yaml');

        if ($container->getParameter('kernel.environment') === 'dev') {
            if (file_exists(__DIR__ . '/../Resources/config/services_dev.yaml')) {
                $loader->load('services_dev.yaml');
            }
        }
    }
}
```

## services.yaml

```yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true

  App\ServerNodeBundle\Controller\:
    resource: '../../Controller/'

  App\ServerNodeBundle\Service\:
    resource: '../../Service/'

  App\ServerNodeBundle\Repository\:
    resource: '../../Repository/'

  App\ServerNodeBundle\EventListener\:
    resource: '../../EventListener/'
```

## CompilerPass

```php
<?php

namespace App\ServerNodeBundle\DependencyInjection\Compiler;

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

final class RemoveOptionalAdminPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container): void
    {
        if ($container->hasDefinition(AdminMenu::class)) {
            $hasLinkGenerator = $container->hasDefinition(LinkGeneratorInterface::class)
                || $container->hasAlias(LinkGeneratorInterface::class);

            if (!$hasLinkGenerator) {
                $container->removeDefinition(AdminMenu::class);
            }
        }
    }
}
```

## 服务标签与自动收集

```php
<?php

use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

#[AutoconfigureTag(name: 'app.data_provider')]
interface DataProviderInterface
{
    public function provide(): iterable;
    public function supports(string $type): bool;
}
```

```php
<?php

use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;

final class AggregateDataService
{
    public function __construct(
        #[TaggedIterator('app.data_provider')]
        private iterable $providers,
    ) {}

    public function collect(string $type): iterable
    {
        foreach ($this->providers as $provider) {
            if ($provider->supports($type)) {
                yield from $provider->provide();
            }
        }
    }
}
```

## 语义化配置

```php
<?php

namespace App\ServerNodeBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

final class Configuration implements ConfigurationInterface
{
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('server_node');
        $treeBuilder->getRootNode()
            ->children()
                ->integerNode('default_port')->defaultValue(8080)->end()
                ->scalarNode('bind_address')->defaultValue('0.0.0.0')->end()
                ->booleanNode('enable_tracing')->defaultFalse()->end()
            ->end();

        return $treeBuilder;
    }
}
```

```php
<?php

// Extension 中加载语义化配置
public function load(array $configs, ContainerBuilder $container): void
{
    $configuration = new Configuration();
    $config = $this->processConfiguration($configuration, $configs);

    $container->setParameter('server_node.default_port', $config['default_port']);
    $container->setParameter('server_node.bind_address', $config['bind_address']);

    $loader = new YamlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
    $loader->load('services.yaml');
}
```

## Monorepo Bundle 依赖

```json
{
    "name": "app/server-node-bundle",
    "type": "symfony-bundle",
    "require": {
        "php": ">=8.1",
        "symfony/framework-bundle": "^6.4 || ^7.0",
        "doctrine/orm": "^3.0",
        "app/doctrine-common-bundle": "self.version"
    },
    "autoload": {
        "psr-4": { "App\\ServerNodeBundle\\": "src/" }
    }
}
```

- `self.version` 引用 monorepo 根版本号，确保内部包同步。
- `type: symfony-bundle` 用于 Flex 自动发现。

## 调试命令

- `php bin/console debug:container --tag=app.data_provider`
- `php bin/console debug:container {ServiceId}`
- `php bin/console debug:autowiring`
- `php bin/console config:dump-reference {bundle_alias}`
- `php bin/console debug:config {bundle_alias}`

## 常见失败模式

- Extension 加载不存在的 YAML 文件，某些环境静默失败。
- `resource` 路径拼写错误，整个命名空间服务未注册。
- CompilerPass 访问另一个 Extension 设置的参数，加载顺序不确定。
- 两个 Bundle 注册同一接口的 autowiring alias，运行时歧义。
- `autoconfigure: true` 意外将某类注册为事件监听器或命令。
