---
name: ux-heuristics
description: 当用户需要诊断界面可用性问题或做启发式评估时使用（交互层：导航混乱、表单阻塞、信息架构复盘）。产品策略级设计审视用 `product-design-critic`；UI 实现质量审查用 `frontend-design-review`。
---

# UX Heuristics

## 适用场景

- 用户反馈“找不到入口”“不知道系统在干什么”“提交后没反应”。
- 需要在没有真实用户测试前，先做一轮低成本可用性体检。
- 要给页面、流程、组件输出可执行的严重级别与修复顺序。
- 发现问题已经超出视觉层，需结合 [ux-researcher-designer](../ux-researcher-designer/SKILL.md) 一起处理。
- 具体评估细则优先读取 [Nielsen 十原则](references/nielsen-heuristics.md)、[Krug 导航检查](references/krug-principles.md) 与 [审计模板](references/audit-template.md)。

## 核心约束

- 先描述任务目标、用户上下文和阻塞行为，再给结论；不要只给“界面不好看”。
- 每个问题必须同时给出 `heuristic`、`severity(0-4)`、`evidence`、`recommendation`。
- 视觉问题只有在影响任务完成、理解成本或信任时，才归入启发式问题。
- 明显的启发式错误先直接修，不要拿 A/B 测试替代基础可用性修复。
- 涉及诱导、误导、强制续费等模式时，必须交叉检查 [暗黑模式参考](references/dark-patterns.md)。
- 涉及对比度、焦点状态、键盘访问时，必须交叉检查 [WCAG 清单](references/wcag-checklist.md)。

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

## 检查清单

- [ ] 页面一眼能回答“我在哪、能做什么、下一步是什么”。
- [ ] 关键操作都有即时状态反馈，且不会诱发重复点击。
- [ ] 导航、按钮、表单标签使用用户语言，不使用内部术语。
- [ ] 错误提示包含“发生了什么、为什么、怎么恢复”。
- [ ] 重要流程存在撤销、返回或安全退出路径。
- [ ] 移动端没有 hover-only 信息和过小触控区。
- [ ] 同一个概念在不同页面命名一致。
- [ ] 需要国际化时已检查 [文化与本地化约束](references/cultural-ux.md)。

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
