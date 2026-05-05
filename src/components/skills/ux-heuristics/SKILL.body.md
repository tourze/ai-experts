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

## 反模式

### FAIL: “建议优化体验”

```
“这个页面体验需要改进”
→ 开发：”改什么？”
```

### PASS: 具体任务失败点

```json
{
  "severity": 4,
  "heuristic": "系统状态可见性",
  "evidence": "提交订单后 4 秒无反馈，用户重复点击",
  "recommendation": "加 loading 状态 + 按钮禁用 + 成功/失败 toast"
}
```

### FAIL: “用户教育”掩盖

```
用户：”我不知道 'BOM Upload' 是什么意思”
你：”我们做个用户培训吧”
→ 真问题：术语是内部黑话，应改成”上传零件清单”
```

### PASS: 改标签不教用户

```
术语本地化：BOM Upload → 上传零件清单
增加 helper text：”CSV 格式，首行字段名”
```

### FAIL: 二次确认代替撤销

```
删除前：[弹窗] “确认删除？”
→ 用户习惯性点”确认” → 仍误删
```

### PASS: 撤销 + 延迟

```
删除后：Toast “已删除 [撤销]”
5 秒内可恢复 / 5 秒后才真删
```
