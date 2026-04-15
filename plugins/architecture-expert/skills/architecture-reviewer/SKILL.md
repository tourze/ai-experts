---
name: architecture-reviewer
description: 在需要评审架构、文档或代码库的设计质量时使用。
---

# architecture-reviewer

## 适用场景
- 适合技术尽调、上线前审计、扩容评估、企业合规审查和架构争议仲裁。
- 支持代码库评审、文档评审和混合评审三种模式。
- 交叉引用：需要画图时改用 `architecture-diagram`；需要深挖实现缺陷时配合 `exhaustive-systems-analysis`。

## 核心约束
- 必须先判断输入模式，再决定是否运行扫描脚本和加载参考文件。
- 评分只允许 `1` 到 `5`，可用 `0.5`；不得改成百分制单维评分。
- 七个维度都要覆盖：结构、扩展性、安全、性能、企业就绪、运维、数据架构。
- 每个结论都要绑定证据：代码路径、配置项、文档原文或用户明确提供的事实。

## 代码模式
- 代码库模式先执行 `skills/architecture-reviewer/scripts/scan_codebase.sh <代码路径>` 获取结构指纹。
- 按需加载 `skills/architecture-reviewer/references/*.md`，只读当前维度对应的参考。
- 报告顺序推荐：评分总览 → 关键风险 → 分维度结论 → 修复优先级。

```bash
bash skills/architecture-reviewer/scripts/scan_codebase.sh /path/to/codebase
```

## 检查清单
- 是否写清了评审模式、假设、输入边界和证据来源。
- 是否标记了 S1 到 S5 风险等级和修复顺序。
- 是否区分“当前实现问题”与“文档缺口/待确认项”。
- 是否给出可执行的整改建议，而不是空泛建议。

## 反模式
- 跳过输入分类，直接套模板打分。
- 没有证据，只用经验判断下结论。
- 把图画得漂亮当成架构质量高。
- 只列风险，不给优先级和落地动作。
