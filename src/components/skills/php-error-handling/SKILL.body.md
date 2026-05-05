## 异常层级

```
DomainException (abstract, extends RuntimeException)
├── ValidationException    — 输入不合法
├── BusinessRuleException  — 规则不允许（如重复邮箱）
└── ExternalServiceException — 第三方不可用
```

代码示例见 [patterns.md](references/patterns.md)。

## 代码模式

代码示例见 [patterns.md](references/patterns.md)。

## 反模式

### FAIL: 吞异常返 false/null

```php
public function findUser(int $id) {
    try {
        return $this->repo->find($id);
    } catch (\Exception $e) {
        return null;  // 调用方："为什么 null？找不到？DB 挂了？"
    }
}
```

### PASS: 异常类型化

```php
public function findUser(int $id): User {
    try {
        return $this->repo->find($id);
    } catch (RecordNotFound $e) {
        throw new UserNotFoundException($id);
    }
    // DBException 不 catch，让上游统一处理
}
```

### FAIL: 直接返回 getMessage

```php
} catch (\Exception $e) {
    return ['error' => $e->getMessage()];
    // 泄露 SQL: "SQLSTATE[42S02]: Base table 'users' doesn't exist"
}
```

### PASS: 用户消息 vs 内部细节

```php
} catch (UserVisibleException $e) {
    return ['error' => $e->getUserMessage()];  // "找不到该用户"
} catch (\Exception $e) {
    Log::error('order.create.fail', ['exception' => $e]);
    return ['error' => '系统繁忙，请稍后重试'];
}
```
