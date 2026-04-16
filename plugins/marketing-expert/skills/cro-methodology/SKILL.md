---
name: cro-methodology
description: "在需要审计网站或落地页转化问题、梳理实验假设和设计 A/B 测试时使用；若任务已明确是弹窗优化或页面实现，分别配合 `popup-cro` 与 `redesign-my-landingpage`。"
---

# 转化优化方法（cro-methodology）

## 适用场景
- 页面有流量但转化弱，想知道阻塞点在哪。
- 需要把访客疑虑、证据缺口和实验优先级整理成可执行方案。
- 想为页面、表单、CTA 或价格信息设计 A/B 测试。

## 核心约束
- 先定义页面目标和关键路径，再审计视觉、文案和证据层。
- 每个实验必须写清假设、影响机制、成功指标和失败回滚条件。
- 优化建议应以证据链为主，参考 [RESEARCH](references/RESEARCH.md)、[PERSUASION](references/PERSUASION.md)、[OBJECTIONS](references/OBJECTIONS.md)。
- 若实验对象是弹窗，转到 [popup-cro](../popup-cro/SKILL.md)；若需要产出实现代码，转到 [redesign-my-landingpage](../redesign-my-landingpage/SKILL.md)。

## 代码模式
- 推荐输出模板：

```md
问题：免费试用按钮点击高，注册提交低
假设：表单字段过多导致中段流失
实验：首屏表单字段从 6 个减到 3 个
主指标：提交率
次指标：线索质量、销售接通率
```

- 辅助资料： [COPYWRITING](references/COPYWRITING.md)、[funnel-analysis](references/funnel-analysis.md)、[testing-methodology](references/testing-methodology.md)。

## 检查清单
- 是否明确了页面目标、主指标和次指标。
- 是否把问题拆到“流量质量、页面表达、证据、摩擦”四层。
- 是否按影响和实施成本给实验排序。
- 是否给出验证窗口和样本量要求。

## 反模式
- 没有证据就拍脑袋改按钮颜色。
- 把多个变量同时改动，导致实验无法归因。
- 只讲“提升转化”，不说明对线索质量的影响。
