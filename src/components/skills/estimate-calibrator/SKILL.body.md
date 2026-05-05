## 适用场景
- 研发排期、路线图沟通、项目承诺、Story points 或任务规模评估。
- 需要参考 [references/estimation-methods.md](references/estimation-methods.md)、[references/sizing-heuristics.md](references/sizing-heuristics.md)、[references/unknown-categories.md](references/unknown-categories.md)。
- 需要验证案例格式时，可查看 [evals/cases.yaml](evals/cases.yaml)。

## 核心约束
- 先拆工作，再估时间；没有边界定义的任务不要直接给单点数值。
- 估算必须显式写出假设、未知项和最坏情况，不允许只报“乐观值”。
- 估算不等于承诺，区间越窄越需要证据支撑。

## 代码模式
```markdown
| 工作项 | Best | Likely | Worst | 主要未知项 |
| --- | --- | --- | --- | --- |
```

## 检查清单
- [ ] 工作已拆到可讨论的不确定性粒度。
- [ ] 已给出三点估算、风险来源和置信度说明。
- [ ] 关键依赖、外部等待和返工概率已纳入。
- [ ] 结果能支撑排期决策，而不是制造虚假确定性。

## 反模式

### FAIL: 含糊需求精确估

```
PM："新版本支付系统大概多久？"
开发："3 周。"
→ 范围未定 / 集成未定 / 合规未定
→ 实际 4 个月，团队疲惫，信任破产
```

### PASS: 拆 + 三点估算

```
"我先列出 8 个待澄清子任务"
"按当前理解：
- 接入新支付方 (Best 5d / Likely 10d / Worst 25d)
- 退款流程改造 (3/7/15)
- 合规审核 (5/10/30 - 高度依赖外部)
合计区间：13-70d，最可能 27d。
但前提 1-3 待澄清，否则区间失效。"
```

### FAIL: 只报乐观值

```
"两周"
→ 老板写进 OKR
→ 第三周：还要两周
→ 第六周：再两周
```

### PASS: 显式区间 + 假设

```
"两周（最佳）/ 三周（最可能）/ 六周（最差）
最差源于：
- 上游 API 延迟交付
- QA 发现兼容性需要返工
建议外部承诺按四周给"
```
