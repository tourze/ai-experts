---
name: security-threat-model
description: "当用户明确要求对代码仓库或目录做 AppSec 威胁建模时使用。"
---

# 仓库级威胁建模

## 适用场景
- 需要基于仓库证据输出针对性的威胁模型，而不是通用模板。
- 需要与 [stride-analysis-patterns](../stride-analysis-patterns/SKILL.md) 联动做系统性枚举。
- 产出威胁后，继续用 [threat-mitigation-mapping](../threat-mitigation-mapping/SKILL.md) 和 [security-requirement-extraction](../security-requirement-extraction/SKILL.md) 落地。

## 核心约束
- 所有组件、边界和控制都必须有仓库证据或明确假设来源。
- 区分运行时路径与 CI/构建/开发工具，避免把辅助脚本混进主系统边界。
- 威胁数量少而精，优先真实攻击者目标与高价值资产。
- 当关键上下文缺失时，先提 1 到 3 个高价值问题再定级。

## 代码模式
```markdown
# <repo>-threat-model.md
- 资产：用户数据、凭据、构建产物、审计日志
- 边界：浏览器 -> API 网关 -> 应用服务 -> 数据库
- 入口：HTTP API、上传接口、后台任务、管理员控制台
- 威胁：跨租户读取、令牌窃取、配置篡改、资源耗尽
```

## 检查清单
- 是否列出资产、边界、入口、攻击者能力和主要假设。
- 每条威胁是否绑定具体入口和受影响资产。
- 优先级是否说明可能性、影响和现有控制。
- 结论是否明确区分证据、推断和待确认项。

## 反模式
- 没有看代码就套模板。
- 把“有数据库”自动推导成所有经典威胁都成立。
- 不区分运行时与测试/脚本路径。
