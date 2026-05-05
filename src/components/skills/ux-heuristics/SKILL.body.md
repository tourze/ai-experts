## 代码模式

审计输出建议直接落成结构化 JSON，方便后续排序、同步和二次处理：

```json
{
  "score": 6,
  "summary": "主流程可完成，但导航定位和状态反馈明显不足。",
  "findings": [
    {
      "severity": 4,
      "heuristic": "系统状态可见性",
      "evidence": "点击“提交订单”后 4 秒内没有 loading、toast 或结果页反馈，用户重复点击两次。",
      "recommendation": "补齐提交中、提交成功、提交失败三段状态反馈，并在按钮上做禁用处理。"
    }
  ]
}
```

代码或设计稿落地前，可先用关键字搜索系统状态、错误反馈、导航命名是否齐全：

```bash
rg -n "loading|spinner|skeleton|toast|aria-live|breadcrumb|empty state|error" src app components
```

若需要进一步细化判断，按下面顺序调 reference：

- [references/krug-principles.md](references/krug-principles.md)
- [references/nielsen-heuristics.md](references/nielsen-heuristics.md)
- [references/heuristic-conflicts.md](references/heuristic-conflicts.md)
- [references/cultural-ux.md](references/cultural-ux.md)
