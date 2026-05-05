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
