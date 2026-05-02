---
name: webman-naming-conventions
description: 当用户要统一或审查 Webman 项目的目录命名、接口后缀、Service 命名或命名空间时使用。
---

Webman 项目命名与目录约束。

## 适用场景

- 统一目录命名、接口后缀、命名空间。
- 审查 Service/Repository 命名。
- 修复命名空间与目录不一致。

## 核心约束

- 目录小写，多词下划线。见 [directory-lowercase](references/directory-lowercase.md)。
- 接口 `Interface` 后缀。见 [interface-naming](references/interface-naming.md)。
- Service `VerbNounService`。见 [service-naming-pattern](references/service-naming-pattern.md)。
- 命名空间与目录一致。见 [namespace-directory-mismatch](references/namespace-directory-mismatch.md)。
- Repository 实现加技术前缀。见 [repository-implementation-naming](references/repository-implementation-naming.md)。

## 代码模式

```php
<?php
// App\Order\Service\PlaceOrderService
// App\Order\Domain\Repository\OrderRepositoryInterface
// App\Order\Infrastructure\EloquentOrderRepository
```

## 检查清单

- [ ] 目录全小写，无驼峰
- [ ] 接口用 `Interface` 后缀
- [ ] Service 命名表达动作
- [ ] 命名空间与目录路径一致

## 反模式

### FAIL: 大小写混用

```
app/
  Order/
    Service/PlaceOrder.php
  Customer/  ← 同级用大写
```
```
macOS 不区分大小写 → 本地正常
Linux 区分 → 部署后 ClassNotFound
```

### PASS: 全小写下划线

```
app/
  order/
    service/PlaceOrderService.php
  customer/
    service/UpdateCustomerService.php
```

### FAIL: 接口无后缀

```php
interface UserRepository {
    public function find(int $id): array;
}

class UserRepositoryEloquent implements UserRepository {
    public function find(int $id): array {
        return ['id' => $id];
    }
}
// 业务代码 use UserRepository → 不知道这是接口还是类
```

### PASS: Interface 后缀

```php
interface UserRepositoryInterface {
    public function find(int $id): array;
}

class EloquentUserRepository implements UserRepositoryInterface {
    public function find(int $id): array {
        return ['id' => $id];
    }
}
// use UserRepositoryInterface → 一眼看出是抽象
```

### FAIL: 命名空间与目录漂移

```
文件路径: app/order/service/PlaceOrderService.php
namespace App\Service;  ← 缺 Order
```
```
PSR-4 加载失败 → "Class App\Service\PlaceOrderService not found"
```

### PASS: 严格映射

```
app/order/service/PlaceOrderService.php
namespace App\Order\Service;
// composer.json: "App\\": "app/"
// 路径分段（首字母大写）= 命名空间分段
```
