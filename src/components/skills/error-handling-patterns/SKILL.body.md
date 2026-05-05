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
