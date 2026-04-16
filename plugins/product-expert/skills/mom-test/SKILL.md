---
name: mom-test
description: 当用户要做客户访谈、验证想法、避免诱导性问题或判断用户是否真的有购买动机时使用；强调讲事实、讲过去、少讲自己的方案。
---

# 妈妈测试

## 适用场景
- 创业想法验证、需求洞察、流失访谈、B2B 销售发现访谈。
- 需要深入阅读问题设计时，可结合 [references/question-patterns.md](references/question-patterns.md)、[references/avoiding-bad-data.md](references/avoiding-bad-data.md)、[references/commitment-advancement.md](references/commitment-advancement.md)。
- 需要把访谈发现落到旅程或问卷时，可配合 [customer-journey-map](../customer-journey-map/SKILL.md) 与 [designing-surveys](../designing-surveys/SKILL.md)。

## 核心约束
- 先聊用户真实经历、当前替代方案和历史行为，再聊你的想法。
- 问题要聚焦过去的具体事实，避免“如果有这个功能你会不会用”。
- 访谈目标是找证据，不是找赞同；礼貌性表扬不能当作需求信号。

## 代码模式
```markdown
坏问题：如果我们做 X，你会买吗？
好问题：你上次遇到这个问题是什么时候？当时怎么解决的？
```

## 检查清单
- [ ] 已准备过去式、事实型、可追问的问题。
- [ ] 已记录用户当前行为、替代方案和付出成本。
- [ ] 已识别 commitment / advancement 信号，而不只看口头兴趣。
- [ ] 访谈结果可直接转成后续验证动作。

## 反模式

### FAIL: 假设题套答案

```
你：如果有 AI 自动整理会议纪要，你会用吗？
用户：会啊，听起来不错
你：$29/月能接受吗？
用户：可以
→ 全是想象，无承诺
```

### PASS: 过去式事实题

```
你：你上次开会后怎么整理纪要的？
用户：录音 + Otter + 手工删，要 30 分钟
你：上次因为这个加班是什么时候？
用户：上周三，整理到 10 点
你：付过费吗？
用户：Otter $20/月
→ 真实痛点 + 已付费 = 强信号
```

### FAIL: “听起来不错”当信号

```
10 人访谈 9 人说”不错”→ 以为 PMF → 上线后 1 人付费
```

### PASS: 看 commitment 信号

```
弱：口头表扬、”会推荐”
中：留邮箱、加 waitlist
强：付定金、开放数据、签 LOI
→ 只把强信号当真实需求
```
