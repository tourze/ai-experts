---
name: ux-heuristics
description: 用启发式评估快速诊断界面可用性问题并给出修复优先级。适用于可用性审计、导航混乱、表单阻塞、信息架构复盘，以及“用户不知道下一步做什么”的场景。
---

# UX Heuristics

## 适用场景

- 用户反馈“找不到入口”“不知道系统在干什么”“提交后没反应”。
- 需要在没有真实用户测试前，先做一轮低成本可用性体检。
- 要给页面、流程、组件输出可执行的严重级别与修复顺序。
- 发现问题已经超出视觉层，需结合 [visual-design-foundations](../visual-design-foundations/SKILL.md) 或 [ux-researcher-designer](../ux-researcher-designer/SKILL.md) 一起处理。
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

- 只给“建议优化体验”而不指出具体任务失败点。
- 把所有问题都归结为“视觉不统一”，忽略导航、状态、容错问题。
- 用“用户教育”掩盖标签含糊、流程绕路、反馈缺失。
- 为了防错堆满二次确认弹窗，而不是改成可撤销操作。
- 在没有证据时把转化问题直接定性为营销问题。
