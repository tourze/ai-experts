# 错误处理模式

## 适用场景

- API 设计、后台任务、批处理、异步工作流和跨服务调用。
- 需要统一错误语义、错误映射和兜底策略。
- 各语言落地时加载对应语言 skill：`go-error-handling`、`python-error-handling`、`rust-error-handling`、`php-error-handling`。

## 核心约束

### 错误三层模型

| 层 | 含义 | 对外暴露 | 处理策略 |
|----|------|---------|---------|
| 验证错误 | 输入不合法 | 具体错误码 + 用户消息 | 调用方修正后重试 |
| 业务错误 | 规则违反（如重复、余额不足） | 业务语义错误码 | 调用方按业务逻辑处理 |
| 外部系统错误 | 依赖故障（DB/网络/第三方） | 通用"服务不可用" | 重试 / 熔断 / 降级 |

### 通用约束

- 不吞异常：如果不能处理，必须传播给调用方。
- 只捕获你能处理的异常类型；其余保留堆栈继续抛出。
- 用户可见消息与内部调试细节分离，禁止把原始异常/堆栈/SQL/路径暴露到接口层。
- 重试必须有边界、有幂等前提、有退避策略，不得无条件重试。
- 批处理要支持部分失败汇总，不因一条坏数据丢掉整批。
- 库/SDK 对外暴露可匹配的错误类型，让调用方能按类型分支处理。
- 对外 API 的错误语义是合同，修改前要反查调用点和测试。

## 通用模式

### 分层捕获 + 保留上下文

```
外部系统调用
  ├─ 可恢复错误（超时/限流）→ 重试 + 退避 + 记录
  ├─ 不可恢复错误（认证/权限）→ 包装为业务错误传播
  └─ 未知错误 → 记录完整上下文 + 继续抛出
```

### 部分失败汇总

```
批处理 100 条
  ├─ 89 条成功
  ├─ 8 条验证失败 → 收集失败原因 + 继续
  └─ 3 条外部超时 → 收集 + 标记可重试
最终返回：BatchResult { succeeded: 89, failed: [{id, reason}, ...] }
```

### 重试边界

```python
for attempt in range(3):
    try:
        return api.call(payload, idempotency_key=key)
    except TransientError:
        time.sleep(2 ** attempt)
raise MaxRetriesExceeded(f"failed after 3 attempts for key={key}")
```

## 检查清单

- 是否明确了错误分类（验证/业务/外部）和传播路径。
- 是否定义了重试、超时、熔断和补偿边界。
- 错误是否携带了诊断所需的上下文与关联 ID。
- 是否对部分失败给出可解释的降级策略。
- 用户可见消息是否不包含内部实现细节。

## 反模式

### FAIL: 吞异常 + 通用错误码

```python
try:
    result = payment_gateway.charge(order)
except Exception:
    return {"error": "something went wrong"}  # 吞掉所有细节
```

### PASS: 分层捕获 + 保留上下文

```python
try:
    result = payment_gateway.charge(order)
except InsufficientFundsError as e:
    return {"error": "insufficient_funds", "message": str(e)}
except GatewayTimeoutError as e:
    logger.warning("payment timeout", extra={"order_id": order.id})
    raise RetryableError("payment_timeout") from e
```

### FAIL: 第三方异常直接暴露

```python
except stripe.error.CardError as e:
    return {"error": str(e)}  # 泄露 Stripe 内部错误格式
```

### PASS: 映射到应用层错误

```python
except stripe.error.CardError:
    return {"error": "payment_failed", "message": "Card was declined"}
```

### FAIL: 无条件重试

```python
while True:
    try:
        return api.call(payload)
    except Exception:
        time.sleep(1)  # 无退避、无上限、不判断幂等性
```

### PASS: 有界重试 + 退避 + 幂等前提
```
for attempt in range(3):
    try: return api.call(payload, idempotency_key=key)
    except TransientError: time.sleep(2 ** attempt)
```
