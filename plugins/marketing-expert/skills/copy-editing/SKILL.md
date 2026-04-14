---
name: copy-editing
description: "在需要审校、润色或系统性提升既有营销文案时使用，覆盖标题、正文、CTA、信息层级和可读性；若任务重点是去除 AI 腔，可配合 `content-humanizer`。"
metadata:
  version: 1.0.0
---

# 文案编辑（copy-editing）

## 适用场景
- 评审既有营销文案、落地页文案或广告文案。
- 需要系统化做“逻辑、清晰度、说服力、可读性”多轮编辑。
- 需要给出具体可改建议，而不是笼统地说“更有说服力一点”。

## 核心约束
- 先判断文案目标和读者，再开始修改；同一份文案不能同时服务所有读者。
- 编辑时优先处理信息结构和含义，再处理措辞与语气。
- 所有改动都要能解释“为什么更好”，而不是凭主观偏好。
- 若主要问题是机器腔和节奏生硬，配合 [content-humanizer](../content-humanizer/SKILL.md)；若主要问题是表达记忆度不足，参考 [made-to-stick](../made-to-stick/SKILL.md)。

## 代码模式
- 先跑可读性诊断：

```bash
python3 scripts/readability_scorer.py --file copy.txt --json
```

- 高频替换表参考 [plain-english-alternatives](references/plain-english-alternatives.md)。

## 检查清单
- 标题是否明确承诺，正文是否支撑承诺。
- CTA 是否具体、低摩擦且与页面意图一致。
- 是否删掉了空洞形容词、重复句、过长句和模糊主语。
- 是否给出修改前后对照，方便用户判断取舍。

## 反模式
- 一上来只改字面，不处理论证顺序和信息层级。
- 为了“更顺”而删掉关键限定条件。
- 把编辑建议写成抽象口号，无法直接落地。
