## 代码模式

```markdown
# 法律风险评估备忘录

## 事项摘要
- 事项：{{matter}}
- 业务负责人：{{owner}}
- 法域：{{jurisdiction}}
- 是否特权材料：{{privileged}}

## 风险判断
- 严重度：{{severity_score}} / 5
- 概率：{{likelihood_score}} / 5
- 风险分：{{risk_score}}
- 风险等级：{{risk_level}}

## 触发路径
1. 触发事件：{{trigger}}
2. 可能后果：{{impact}}
3. 时间窗口：{{timing}}

## 缓释建议
- 立即动作：{{immediate_action}}
- 负责人：{{mitigation_owner}}
- 复审日期：{{next_review}}
```

```json
{
  "severityScale": {
    "1": "可忽略",
    "2": "低",
    "3": "中",
    "4": "高",
    "5": "关键"
  },
  "likelihoodScale": {
    "1": "极低",
    "2": "较低",
    "3": "可能",
    "4": "较高",
    "5": "高度确定"
  },
  "escalationThresholds": {
    "low": "1-4",
    "medium": "5-9",
    "high": "10-15",
    "critical": "16-25"
  }
}
```

```markdown
# 风险登记项最小字段

| 字段 | 内容 |
| --- | --- |
| Risk ID | 唯一编号 |
| Category | 合同 / 监管 / 数据 / 劳动 / 争议 / IP / 公司治理 |
| Trigger | 第一个会让风险落地的事件 |
| Severity | 1-5 |
| Likelihood | 1-5 |
| Current Controls | 已有控制 |
| Mitigation Owner | 缓释责任人 |
| Residual Risk | 缓释后剩余风险 |
| Escalation | 无 / 高级法务 / 总法律顾问 / 外部律师 / 董事会 |
```
