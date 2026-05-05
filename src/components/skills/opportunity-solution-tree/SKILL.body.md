## 核心约束
- 树顶必须是单一且可度量的 outcome，不能把功能目标写在最上面。
- Opportunity 要从用户问题或欲望出发，不要直接写解决方案。
- 每条分支最终都应落到可验证实验，而不是停在“以后做”。

## 代码模式
```markdown
Outcome
└─ Opportunities
   └─ Solutions
      └─ Experiments
```

## 检查清单
- [ ] Outcome、机会、方案、实验四层结构清楚。
- [ ] 机会来自研究证据，而非主观猜想。
- [ ] 方案和实验有优先级与判定标准。
- [ ] 可以直接衔接需求文档或实验计划。

## 反模式

### FAIL: 跳过机会层

```
Outcome: D30 留存 +10pp
└─ Solutions:
    - 推送通知优化
    - 签到送积分
    - 新增 onboarding 视频
→ 解决方案根本没追溯到用户问题
→ 全做完留存可能仍不变
```

### PASS: 三层完整

```
Outcome: D30 留存 +10pp
└─ Opportunity 1: 用户首日不知道核心价值（访谈 8/10 提及）
    └─ Solution: 把核心场景做成 30s 内必触发的引导
        └─ Experiment: A/B 测试新 onboarding，观察 D7 激活率
└─ Opportunity 2: 第 7 天没有触发回访理由
    └─ Solution: 个性化 weekly digest
        └─ Experiment: 30% 用户灰度，对比 D14 留存
```

### FAIL: 实验无判定

```
"做个 A/B 测试看看效果"
→ 跑 2 周 → 数据涨了 0.3% → 算成功还是失败？
→ 没人能定
```

### PASS: 预设阈值 + 样本量

```
实验目标：D7 激活率 +3pp（绝对值）
样本量：每组 5000 用户（基于 80% power）
判定：
- p < 0.05 且效应 ≥ +2pp → 全量
- 效应 +1 到 +2pp → 迭代再测
- < +1pp 或负效应 → 停止
```
