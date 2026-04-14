---
name: stride-analysis-patterns
description: "当需要用 STRIDE 框架系统性识别欺骗、篡改、抵赖、信息泄露、拒绝服务和提权风险时使用。"
---

# STRIDE 威胁分析

## 适用场景
- 需要对系统、模块或数据流做结构化威胁枚举。
- 需要给 [security-threat-model](../security-threat-model/SKILL.md) 提供覆盖式分析骨架。
- 需要用 [attack-tree-construction](../attack-tree-construction/SKILL.md) 继续展开重点路径。

## 核心约束
- 按组件、边界或数据流逐一过 STRIDE，不要整系统一锅端。
- 每个 STRIDE 标签都要落到具体滥用场景和资产影响。
- 把现有控制和建议控制分开写。
- 不要用 STRIDE 标签替代真实风险描述。

## 代码模式
```markdown
| 边界 | STRIDE | 场景 | 影响资产 | 现有控制 |
| --- | --- | --- | --- | --- |
| API -> DB | T | 通过未校验字段篡改账单状态 | 账单完整性 | ORM 参数化 |
| Browser -> API | S | 伪造管理员令牌调用导出接口 | 管理员权限 | JWT 校验 |
```

## 检查清单
- 每个边界是否至少过一遍六类威胁。
- 是否写明攻击动作、前置条件和影响资产。
- 是否标出已有控制和缺口。
- 是否避免重复堆叠相同威胁。

## 反模式
- 只有 STRIDE 标签，没有具体场景。
- 把漏洞名和 STRIDE 分类混着写。
- 没有边界和数据流就强行做 STRIDE。
