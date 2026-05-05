## 适用场景

- API、CLI、队列 worker 需要稳定处理坏输入和外部依赖失败。
- 需要建立统一异常层级和用户可见错误映射。
- 批处理场景要区分"全部失败"和"部分失败"。

通用错误处理原则（三层模型、重试边界、部分失败）见 architecture-expert 的 error-handling-patterns skill。

## 核心约束

- 只捕获你能处理的异常类型；其余保留堆栈继续抛出。
- 用户可见消息与内部调试细节分离，不暴露 SQL、路径、堆栈。
- 用户输入必须在进入业务逻辑前完成校验和归一化。

## 异常层级

```
DomainException (abstract, extends RuntimeException)
├── ValidationException    — 输入不合法
├── BusinessRuleException  — 规则不允许（如重复邮箱）
└── ExternalServiceException — 第三方不可用
```

代码示例见 [patterns.md](references/patterns.md)。

联动：[php-testing](../php-testing/SKILL.md) · [php-type-safety](../php-type-safety/SKILL.md)

## 代码模式

代码示例见 [patterns.md](references/patterns.md)。

## 检查清单

- 异常分为验证层、业务层、外部依赖层。
- try/catch 只出现在真正需要处理或转换异常的地方。
- 用户可见错误消息不包含堆栈、SQL、文件路径。
- 批量处理有部分失败汇总机制。

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
