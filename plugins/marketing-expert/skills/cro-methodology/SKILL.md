---
name: cro-methodology
description: 在需要审计网站或落地页转化问题、梳理实验假设和设计 A/B 测试，或优化弹窗、注册流程、新手引导、AIDA 漏斗转化时使用。
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
- 若实验对象是弹窗，转到 [popup-cro](references/popup-cro.md)；若需要产出实现代码，转到 [redesign-my-landingpage](../redesign-my-landingpage/SKILL.md)。

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

### FAIL: 拍脑袋改

```
“按钮改红色试试”
→ 没漏斗数据、没调研用户，凭直觉
```

### PASS: 先诊断再实验

```
漏斗：10000 访问 → 8000 首屏 → 1200 表单页 → 180 提交
阻塞点：表单页 15% → 1.8% 骤降
假设：6 字段过多
实验：减到 3 字段
主指标：提交率；次指标：线索质量
```

### FAIL: 多变量同改

```
A/B：同改标题+图片+按钮颜色+CTA 文案
B +12% → 不知道哪个起作用
```

### PASS: 一次一变量

```
实验 1：只改 CTA 文案
实验 2：只改按钮位置
每个独立归因
```

### FAIL: 只看转化不看质量

```
“表单简化后提交 +40%”
→ 销售：70% 是机器人，接通率腰斩
```

### PASS: 主副指标同时看

```
主：提交率
副：销售接通率、成单率、7 日留存
主+副同正才算成功
```
