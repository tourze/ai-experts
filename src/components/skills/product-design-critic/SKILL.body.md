## 代码模式
```markdown
任务目标 -> 主界面承担什么 -> 哪些状态最关键 -> 哪些地方损害信任 -> 建议
```

## 反模式

### FAIL: 抽象审美词

```
"看起来不够现代""再高级一点"
→ 设计师改了三版仍被否
```

### PASS: 落到行为变化

```
"主 CTA 当前在折叠区下方 → 移到首屏"
"结算第 3 步缺进度指示 → 加 1/3, 2/3"
"错误态只有 'Failed' → 改为 what+why+fix"
```

### FAIL: 只改视觉

```
"重做 Logo + 配色"
→ 用户仍流失，注册流程 12 步没动
```

### PASS: 先架构再视觉

```
1. 流程能 ≤ 3 步完成核心任务吗
2. 主次能一眼看出吗
3. 错态/空态/loading 都做了吗
→ 都通过才碰视觉
```

## 参考资料

- [references/industry-anti-patterns.md](references/industry-anti-patterns.md) — 12+ 行业反模式清单
- `industry-design-presets` — 行业正向预设（风格/配色/字体）
