---
title: CLI 命令冒烟测试
impact: HIGH
impactDescription: 验证命令注册和基本执行
tags: integration, smoke, cli, console, command
---

## CLI 命令冒烟测试

**影响：高（验证命令注册和基本执行）**

为控制台命令编写冒烟测试，验证它们已注册、接受预期参数并返回成功退出码。与 HTTP 冒烟测试类似，这些测试尽早捕获接线和配置问题。

**错误（无命令测试）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ImportUsersCommand;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// 直接测试命令类——遗漏了依赖注入接线
final class ImportUsersCommandTest extends TestCase
{
    #[Test]
    public function it_has_correct_name(): void
    {
        $command = new ImportUsersCommand();

        $this->assertSame('app:import-users', $command->getName());
    }
}
```

**正确（使用 CommandTester 的命令冒烟测试）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Command;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;

final class ImportUsersCommandTest extends KernelTestCase
{
    #[Test]
    public function it_executes_successfully_with_dry_run(): void
    {
        $kernel = self::bootKernel();
        $application = new Application($kernel);

        $command = $application->find('app:import-users');
        $commandTester = new CommandTester($command);

        $commandTester->execute(['--dry-run' => true]);

        $commandTester->assertCommandIsSuccessful();
        $this->assertStringContainsString('Dry run', $commandTester->getDisplay());
    }
}
```
