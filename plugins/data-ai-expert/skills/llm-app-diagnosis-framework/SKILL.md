---
name: llm-app-diagnosis-framework
description: 当需要系统化诊断 LLM 应用问题（幻觉/检索失配/指令对抗/token 超限/过度引用）、区分 model-first 与 prompt-first 适用边界、或建立 eval-first 改进闭环时使用。与 llm-app-design-pipeline 互补：后者给设计流程，本 skill 给诊断方法与决策框架。
---

# LLM 应用诊断框架

## 适用场景

- LLM 应用出现质量问题但不确定问题在哪一层
- 需要判断用 model-first（让模型拆步骤）还是 prompt-first（人工设计 chain）
- 需要建立"先补 eval → 再改 prompt/检索"的改进闭环
- prompt 改了很多轮但没有系统衡量效果

## 核心原则

**Eval-first**：没有 eval 不允许声称"更好"。先设计可复现的离线 eval case，再改 prompt 或检索参数。

**不跨层归因**：检索失败不写成 prompt 问题，幻觉不写成 embedding 问题。每层问题在对应层修复。

## 四层诊断

按「输入侧 → 检索 → 推理 → 输出侧」逐层排查，不混层下结论。

### 第一层：输入侧

问题信号：用户意图被截断、关键信息缺失、多轮上下文污染。

检查点：输入预处理是否丢字段、system prompt 是否被用户注入覆盖、历史消息是否保留正确窗口。

### 第二层：检索

问题信号：引用不准、漏关键文档、噪声文档排在前面。

检查点：chunking 策略（语义边界/重叠）、embedding 模型与域匹配度、混合检索权重、rerank 阈值、top-k 设置。

### 第三层：推理

问题信号：逻辑跳跃、指令遗忘、工具调用错误、思维链中断。

检查点：temperature 过高导致注意力分散、stop token 过早、tool definition 歧义、few-shot 示例与当前问题不匹配。

### 第四层：输出侧

问题信号：幻觉引用、格式错乱、内容被截断、安全拒答覆盖正常回答。

检查点：引用对齐策略、输出 parser 容错、max_tokens 限制、guardrails 误杀率。

## Model-first vs Prompt-first

| 维度 | Model-first | Prompt-first |
|------|-----------|-------------|
| 策略 | 让模型自己拆解复杂任务 | 人工设计 chain/agent 控制执行流 |
| 适用 | 任务路径多、每个 case 差异大、拆解规则难枚举 | 任务步骤确定、输出格式严格、需要审计中间状态 |
| 代价 | 推理 token 高、可能走到死胡同 | 设计成本高、对任务变化不灵活 |
| 信号 | 单 prompt 下模型能稳定拆解 → 优先 model-first | 模型反复走错分支、跳过关键步骤 → 切 prompt-first |

决策方法：先给模型 10 个 case 用单 prompt 跑 model-first，如果 ≥8 个拆解正确且无跳过关键步骤，保持 model-first；否则在失败的 case 上设计 prompt-first chain。

## 改动队列

每条改动必须可证伪：

```
改动：<改什么>
假设：<为什么能改善>
绑定 eval case：<哪个 case 验证>
baseline 对比：<改动前分数 → 目标分数>
风险：<可能变差的场景>
```

## 检查清单

- [ ] 问题定位到了具体层（输入/检索/推理/输出），不是笼统的"效果不好"。
- [ ] model-first vs prompt-first 决策有 10 case 实验支撑。
- [ ] 每条改动有绑定的 eval case 和 baseline 对比方法。
- [ ] 不同层的问题在对应层修复，不跨层打补丁。
- [ ] 检索调参同时报告召回、延迟、内存/成本三角数据。

## 交叉引用

- [`llm-app-design-pipeline`](../llm-app-design-pipeline/SKILL.md)：LLM 应用五步设计流程
- [`prompt-engineering-patterns`](../prompt-engineering-patterns/SKILL.md)：prompt 模板与约束设计
- [`llm-evaluation`](../llm-evaluation/SKILL.md)：离线 eval 设计与评测方法
- [`rag-auditor`](../rag-auditor/SKILL.md)：RAG 管线审计与故障分类
