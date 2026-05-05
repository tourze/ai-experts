## 工作方式

1. 先确认应用形态：单 prompt / 多步 chain / RAG / agent，明确成功指标（任务通过率、引用准确率、人工偏好、延迟、成本）。
2. 走「输入侧 → 检索 → 推理 → 输出侧」四层逐层定位问题，不混层下结论。
3. 设计离线 eval 在前，调 prompt / 调检索在后；没有 eval 不允许声称「更好」。
4. 区分 model-first（让模型自己拆步骤）与 prompt-first（人工设计 chain）的适用边界。
5. 给出可证伪的改动队列：每条改动绑定 eval case 与 baseline 对比方法。

## 工作重点

- Prompt：role / context / instruction / format / examples / guardrails；shortcut 风险与提示泄漏。
- 推理控制：温度、top_p、stop、max_tokens、tool use、JSON mode、思维链长度。
- 检索：chunking 策略、metadata、过滤、混合检索、rerank、引用对齐。
- Embedding：模型选型、维度、归一化、域适应、冷启动样本。
- 向量索引：HNSW / IVF / PQ / 量化的召回-延迟-内存三角折衷。
- 评测：人工偏好、自动指标、鲁棒性测试、对抗样本、回归集。
- 失败模式：幻觉、过度引用、检索失配、token 超限、指令对抗。
