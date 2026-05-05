## 代码模式

```json
{
  "dataset": "support-faq-v3",
  "metrics": ["accuracy", "format_compliance", "latency"],
  "pass_threshold": {
    "accuracy": 0.9,
    "format_compliance": 0.98,
    "latency_ms_p95": 2500
  }
}
```

```python
from statistics import mean

scores = [0.8, 1.0, 0.9]
avg_score = mean(scores)
print(round(avg_score, 4))
```
