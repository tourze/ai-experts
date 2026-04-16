---
name: content-humanizer
description: "在内容显得机器腔、套话重、节奏僵硬或缺乏品牌个性时使用；若任务是直接编辑营销文案，可与 `copy-editing` 配合。"
---

# 人性化改写（content-humanizer）

## 适用场景
- 用户明确反馈“这段文案太像 AI 写的”。
- 需要把已有初稿改得更像真人说话，有品牌语气和判断。
- 想先检测 AI 腔问题，再决定重写范围。

## 核心约束
- 先诊断再动刀；不知道问题类型，就不要直接“润色”。
- 人性化不等于口语化堆砌，必须保留事实、结构和品牌边界。
- 避免凭空注入不存在的个人经历、客户案例或主张。
- 若任务是页面级营销文案精修，配合 [copy-editing](../copy-editing/SKILL.md)；若是选题规划，切到 [content-strategy](../content-strategy/SKILL.md)。

## 代码模式
- 先跑诊断分数：

```bash
python3 scripts/humanizer_scorer.py draft.txt --json
```

- 再用 [ai-tells-checklist](references/ai-tells-checklist.md) 和 [voice-techniques](references/voice-techniques.md) 做定向改写。

## 检查清单
- 是否标出了 AI 腔最重的词、句型、段落节奏问题。
- 是否保留原文事实，不靠编故事“变真实”。
- 是否把品牌语气说清楚：直接、专业、克制、锋利，还是亲切。
- 是否说明哪些问题需要重写，哪些只需微调。

## 反模式
- 只删几个高频 AI 词，就宣称“已经有人味”。
- 为了显得自然而牺牲准确性、合规性或品牌一致性。
- 把人性化当成无限加情绪词和感叹号。
