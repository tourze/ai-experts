---
name: webman-best-practices
description: Webman 项目必须使用。覆盖 DDD 分层、依赖注入、领域模型、命名规范与 PER 风格约束，适用于搭建 Webman 服务、审查分层边界、修复 Service/Repository 设计问题或统一 PHP 代码风格时。
license: MIT
metadata:
  author: webman-design
  version: "1.0.0"
---

Webman 项目默认采用 DDD 分层与显式依赖边界。这个 skill 不解释 PHP 或框架基础，而是把最容易退化的架构约束、命名规则和审查切入点压缩成一套可执行清单。

## 适用场景

- 用户正在开发或重构 Webman 项目，需要在 `controller / service / domain / infrastructure` 之间划清职责边界。
- 用户要审查 Service、Repository、Entity、Value Object 的职责是否放对层级。
- 用户要统一目录命名、命名空间、接口后缀、`declare(strict_types=1)`、`final class` 等 PHP 代码约束。
- 用户反馈“能跑但结构越来越乱”，尤其出现 Controller 直连 Model、Service 互相调用、领域对象贫血化时。
- 需要和 `php-expert` 一起工作时，把 PHP 语法、静态分析和 Webman 架构约束分层处理；本 skill 负责架构与约束判断。

## 核心约束

- 分层边界：
  Controller 只做协议转换和鉴权入口，禁止跳过 Service 直接操作 Model。详见 [controller-skip-service](references/architecture/controller-skip-service.md)。
- 依赖方向：
  Domain 层不能依赖 Webman/数据库/请求对象；基础设施实现要依赖契约而不是反过来。详见 [domain-framework-dependency](references/architecture/domain-framework-dependency.md) 与 [infrastructure-without-contract](references/architecture/infrastructure-without-contract.md)。
- Service 角色：
  Service 负责应用编排，不承担领域规则本体；禁止 Service 之间循环依赖，也禁止在 Service 中直接黏贴查询逻辑替代 Repository。详见 [service-circular-dependency](references/architecture/service-circular-dependency.md) 与 [service-direct-model-access](references/architecture/service-direct-model-access.md)。
- 命名与目录：
  目录统一小写；接口显式使用 `Interface` 后缀；Service 名称表达动作；命名空间必须和目录一致。详见 [directory-lowercase](references/naming/directory-lowercase.md)、[interface-naming](references/naming/interface-naming.md)、[service-naming-pattern](references/naming/service-naming-pattern.md)、[namespace-directory-mismatch](references/naming/namespace-directory-mismatch.md)。
- PHP 风格：
  默认 `declare(strict_types=1);`、完整类型声明、优先 `final class`、可提升时使用构造函数属性提升，不可变数据优先 `readonly`。详见 [strict-types-declaration](references/code-style/strict-types-declaration.md)、[complete-type-declarations](references/code-style/complete-type-declarations.md)、[prefer-final-classes](references/code-style/prefer-final-classes.md)、[constructor-property-promotion](references/code-style/constructor-property-promotion.md)、[readonly-properties](references/code-style/readonly-properties.md)。
- 领域模型：
  Entity 必须有身份标识；Value Object 保持不可变；业务规则优先放回 Domain；副作用通过领域事件表达；拒绝只有 getter/setter 的贫血模型。详见 [entity-identity](references/domain/entity-identity.md)、[value-object-immutability](references/domain/value-object-immutability.md)、[business-logic-in-domain](references/domain/business-logic-in-domain.md)、[domain-events](references/domain/domain-events.md)、[rich-domain-model](references/domain/rich-domain-model.md)。
- 注入方式：
  默认构造函数注入；禁止静态工具类替代依赖注入；禁止服务定位器。详见 [constructor-injection](references/architecture/constructor-injection.md)、[avoid-static-methods](references/architecture/avoid-static-methods.md)、[no-service-locator](references/architecture/no-service-locator.md)。

## 代码模式

优先写“薄 Controller + 编排型 Service + 有行为的 Domain + 契约驱动的 Infrastructure”，而不是把数据库细节和业务规则揉进同一个类。

```php
<?php

declare(strict_types=1);

namespace App\Order\Controller;

use App\Order\Service\PlaceOrderServiceInterface;
use support\Request;
use support\Response;

final class OrderController
{
    public function __construct(
        private PlaceOrderServiceInterface $placeOrderService,
    ) {
    }

    public function store(Request $request): Response
    {
        $orderId = $this->placeOrderService->handle(
            customerId: (string) $request->post('customer_id'),
            amount: (int) $request->post('amount'),
        );

        return json(['order_id' => $orderId], 201);
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Order\Service;

use App\Order\Domain\Event\OrderPlaced;
use App\Order\Domain\Model\Order;
use App\Order\Domain\Repository\OrderRepositoryInterface;
use App\Order\Domain\ValueObject\Money;
use App\Order\Domain\ValueObject\OrderIdGeneratorInterface;

interface PlaceOrderServiceInterface
{
    public function handle(string $customerId, int $amount): string;
}

final class PlaceOrderService implements PlaceOrderServiceInterface
{
    public function __construct(
        private OrderRepositoryInterface $orders,
        private OrderIdGeneratorInterface $orderIds,
    ) {
    }

    public function handle(string $customerId, int $amount): string
    {
        $order = Order::place(
            id: $this->orderIds->next(),
            customerId: $customerId,
            amount: new Money($amount, 'CNY'),
        );

        $this->orders->save($order);
        $this->orders->appendEvent(new OrderPlaced($order->id()));

        return $order->id();
    }
}
```

看到下面这些信号时，优先回到对应规则文件，而不是在当前类里继续“补丁式修复”：

- Controller 开始堆业务判断：回看 [controller-skip-service](references/architecture/controller-skip-service.md)。
- Service 越写越像仓储和 SQL 容器：回看 [service-direct-model-access](references/architecture/service-direct-model-access.md)。
- Entity 只剩下 DTO 行为：回看 [rich-domain-model](references/domain/rich-domain-model.md)。

## 检查清单

- 入口层是否只负责请求解析、鉴权、响应组装，没有直接操作 Model 或 DB？
- 每个 Service 是否只做用例编排，没有承载领域规则本体，也没有和其他 Service 互相缠绕？
- Repository 是否全部通过接口暴露给上层，具体实现是否留在 Infrastructure？
- Domain 层是否完全摆脱框架对象、数据库连接、HTTP 请求对象？
- Entity / Value Object 是否有明确身份与不变量，是否避免了可变共享状态？
- 新增文件是否带 `declare(strict_types=1);`，类是否默认 `final`，公开 API 是否补齐类型？
- 目录、命名空间、接口后缀、Service 命名是否遵守统一规则？
- 如果改动牵涉事件、副作用或外部系统，是否先建领域事件再决定由谁消费？

## 反模式

- 让 Controller 直接查表、拼 DTO、落库，再在注释里声称“只是简单逻辑”。这是架构退化的起点。见 [controller-skip-service](references/architecture/controller-skip-service.md)。
- 为了图快把 `Request`、`Db`、ORM Model 直接塞进 Domain 或 Entity。这样会把核心规则绑死在框架实现上。见 [domain-framework-dependency](references/architecture/domain-framework-dependency.md)。
- 用静态方法、全局容器、服务定位器“省掉”依赖注入。这样会让测试、替换实现和追踪调用链同时失控。见 [avoid-static-methods](references/architecture/avoid-static-methods.md) 与 [no-service-locator](references/architecture/no-service-locator.md)。
- 把所有校验和业务分支堆到 Service，让 Entity 退化成 getter/setter 集合。见 [business-logic-in-domain](references/domain/business-logic-in-domain.md) 与 [rich-domain-model](references/domain/rich-domain-model.md)。
- 目录大小写混用、命名空间漂移、接口和实现命名随意变化。短期能跑，长期会持续制造自动加载、搜索和协作成本。见 [directory-lowercase](references/naming/directory-lowercase.md) 与 [namespace-directory-mismatch](references/naming/namespace-directory-mismatch.md)。
