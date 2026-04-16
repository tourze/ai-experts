---
name: error-handling-patterns
description: "在需要设计异常传播、Result 风格错误、局部降级、重试边界和错误分层时使用。"
---

# error-handling-patterns

## 适用场景
- 适合 API 设计、后台任务、批处理、异步工作流和跨服务调用。
- 适合统一错误语义、错误映射和兜底策略。
- 交叉引用：若要整理具体代码，配合 `code-refiner`；若要做系统层面设计，配合 `system-design`。

## 核心约束
- 先分清可恢复错误、不可恢复错误、业务拒绝和程序缺陷。
- 重试必须有边界、有幂等前提、有退避策略，不得无条件重试。
- 对外错误语义要稳定，对内诊断信息要可观测。
- 禁止用吞异常、全局兜底或静默降级掩盖真正故障。

## 代码模式
- 按层设计错误：领域错误、接口错误、基础设施错误、外部依赖错误。
- 为批处理或并发任务定义“单项失败如何记录、整体何时失败”。
- 需要代码重构时同步检查返回值、日志、监控和告警语义。


## 检查清单
- 是否明确了错误分类、传播路径和对外映射。
- 是否定义了重试、超时、熔断和补偿边界。
- 是否保留了诊断所需的上下文与关联 ID。
- 是否对部分失败给出可解释的降级策略。

## 反模式

### FAIL: 吞异常 + 通用错误码

```python
try:
    result = payment_gateway.charge(order)
except Exception:
    return {"error": "something went wrong"}  # 吞掉所有细节
```

→ 调用方无法区分余额不足、网络超时还是参数错误，排障只能猜。

### PASS: 分层捕获 + 保留上下文

```python
try:
    result = payment_gateway.charge(order)
except InsufficientFundsError as e:
    return {"error": "insufficient_funds", "message": str(e)}
except GatewayTimeoutError as e:
    logger.warning("payment timeout", extra={"order_id": order.id, "cause": str(e)})
    raise RetryableError("payment_timeout") from e
except Exception as e:
    logger.error("unexpected payment error", exc_info=True)
    raise
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

```python
for attempt in range(3):
    try:
        return api.call(payload, idempotency_key=key)
    except TransientError:
        time.sleep(2 ** attempt)
raise MaxRetriesExceeded(f"failed after 3 attempts for key={key}")
