---
name: structured-problem-decomposition
description: 当需要把复杂模糊问题系统性拆解为可执行步骤时使用——从问题界定、结构化拆解、根因分析、系统动态识别、决策推进到 PDCA 改进闭环的六阶段编排流程。与 mckinsey-7-step（流程框架）、fishbone-diagram（根因工具）、first-principles-decomposer（假设挑战）互补：本 skill 给端到端编排逻辑和各阶段过渡标准。
---

# 结构化问题拆解编排

## 适用场景

- 问题模糊，需要先界定再拆解
- 涉及多个可能根因，需要系统性排除
- 需要从分析推进到决策再到执行闭环
- 涉及多方利益、反馈回路或二阶效应

## 不适用场景

- 问题已明确、根因已知 → 直接用对应框架 skill
- 纯技术调试（有 stack trace / 日志） → 用 `debug-methodology`
- 只需单一框架分析 → 直接用那个 skill

## 六阶段流水线

```
问题界定 → 结构化拆解 → 根因分析 → 系统动态 → 决策推进 → PDCA 闭环
```

| 阶段 | 调用 skill | 过渡标准 | 红旗 |
|------|-----------|----------|------|
| 1. 问题界定 | `mckinsey-7-step`（问题定义步）或 5W2H | 任何同事能一句话说清"在回答什么、不回答什么" | 问题描述超 3 句说不清 → 先收敛范围 |
| 2. 结构化拆解 | `mckinsey-7-step`（拆解步）或 `structured-business-analysis-framework`（MECE 假设树） | 每个 P0 假设有验证方式 | 全是"可能是 X"无验证方法 → 先设计验证 |
| 3. 根因分析 | `fishbone-diagram`、`first-principles-decomposer` | 至少一个根因证据强度达"事实"，排除了明显伪相关 | 根因超 5 个排不动 → 回到阶段 2；根因不可证伪 → 降级为假设 |
| 4. 系统动态 | `systems-thinking`、`process-optimization`、`business-health-diagnostic` | 识别出至少一个反馈回路，理解"修 A 会不会搞坏 B" | 只有单点分析 → 可能遗漏系统性风险 |
| 5. 决策推进 | `running-decision-processes`、`planning-under-uncertainty` | 建议含决策人、时间窗、回退策略 | 无人需要做决定 → 可能不是真问题 |
| 6. PDCA 闭环 | `pdca-cycle` | 有检查点时间、负责人、兜底方案 | 只写"做什么"没写"怎么验证生效" |

详细每阶段展开见 [references/six-phases.md](references/six-phases.md)。

## 阶段跳跃规则

- 问题已界定清晰 → 从阶段 2 切入
- 根因已知且已验证 → 跳到阶段 5
- 纯技术问题无组织/流程维度 → 跳过阶段 4
- 决策已做出只需执行 → 从阶段 6 切入

## 质量标准

- 每个根因候选标注证据强度（事实/推断/假设）和反证方式
- 不可证伪的归因显式降级为"待验证假设"
- 决策建议可触发（有决策人、时间窗）、可回退（有兜底方案）
- 跨框架冲突正面解释，不简单堆叠
- 不确定时降级到选项 + 触发条件，不强行给单一结论
