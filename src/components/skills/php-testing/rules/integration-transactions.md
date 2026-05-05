---
title: 数据库事务清理测试数据
impact: MEDIUM
impactDescription: 快速、可靠的数据库状态重置
tags: integration, database, transactions, cleanup, rollback
---

## 数据库事务清理测试数据

**影响：中（快速、可靠的数据库状态重置）**

将每个数据库测试包裹在事务中，测试完成后回滚。这比截断表或重新加载 fixture 快得多，并保证下一个测试有干净的状态。

大多数框架开箱即支持（例如 Symfony 的 `KernelTestCase` 配合 `dama/doctrine-test-bundle`）。

**错误（使用 DELETE 语句手动清理）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRepository;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRepositoryTest extends TestCase
{
    protected function tearDown(): void
    {
        // 缓慢且易出错的手动清理
        $this->getConnection()->exec('DELETE FROM users');
        $this->getConnection()->exec('DELETE FROM orders');
        $this->getConnection()->exec('ALTER TABLE users AUTO_INCREMENT = 1');
    }

    #[Test]
    public function it_persists_user(): void
    {
        // ...
    }
}
```

**正确（通过扩展进行事务回滚）：**

```xml
<!-- phpunit.xml -->
<extensions>
    <bootstrap class="DAMA\DoctrineTestBundle\PHPUnit\PHPUnitExtension"/>
</extensions>
```

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class UserRepositoryTest extends KernelTestCase
{
    #[Test]
    public function it_persists_user(): void
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $user = new User('John', 'john@example.com');

        $em->persist($user);
        $em->flush();

        $this->assertNotNull($user->getId());
        // 此测试后事务自动回滚
    }
}
```

参考：[DAMA Doctrine Test Bundle](https://github.com/dama/doctrine-test-bundle)
