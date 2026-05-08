# Decision Contract

将“要不要做”压缩为可执行的决策输入。

## 必填项

- `decision_question`: 具体决策问题
- `time_horizon`: 判断时窗
- `success_metric`: 成功指标
- `actions`: 候选行动列表
- `risk_tolerance`: 可接受下行范围

## 输出要求

- 用一句话写清当前推荐动作
- 写清不做该动作的触发条件
- 写清何时重开判断

## 示例

```json
{
  "decision_question": "是否在下季度进入新市场",
  "time_horizon": "90 days",
  "success_metric": "首月有效线索 >= 40",
  "actions": ["进入", "推迟 1 季度", "放弃"],
  "risk_tolerance": "可承受 15% 预算试错"
}
```
