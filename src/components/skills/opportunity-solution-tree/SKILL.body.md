## 代码模式
```markdown
Outcome
└─ Opportunities
   └─ Solutions
      └─ Experiments
```

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
