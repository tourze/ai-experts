---
name: incident-response
description: 当用户反馈服务异常、性能下降、报错、中断、告警升级或需要事故响应协助时使用。
---

# 事故响应

事故全生命周期方法论。两阶段推进：Phase 1 证据驱动分级诊断，Phase 2 时间线驱动指挥决策。

## 适用场景

- 线上服务异常、性能下降、报错或中断。
- 需要从症状快速分类为服务、性能、网络、认证或数据问题。
- 事故复盘前还原完整时间线和决策链。

## 核心约束

- 先只读排查，再提出修复；未经确认不重启或改配置。
- 每次只验证一个假设，记录证据与反证。
- 时间线优先：先建时间线再下结论；禁止跳过时间线直接猜根因。
- 止血先于根因修复：先执行可逆止血，根因修复进 follow-up。
- 区分根因与触发因素：「让事故可能的脆弱性」≠「这次触发的具体动作」。
- 时间线按 UTC 排序；本地时间显式标注时区。
- 报告中不暴露生产 secret/token；引用日志时脱敏。

## Phase 1: 诊断（Triage）

1. 确认影响面：用户/下游/收入、起始时间、严重度、上下游依赖。
2. 采集证据：服务状态、错误日志、磁盘、端口、进程。
3. 生成 2-3 个排序假设，不要只盯单点。
4. 逐个验证，排除后再锁定根因。

初始排查命令：

```bash
systemctl list-units --failed --no-pager
journalctl -p err --since "1 hour ago" --no-pager -n 50
df -h; ss -tlnp
```

根因记录模板：

```text
症状：
触发条件：
候选假设：1. ... 2. ...
根因：
证据：
修复建议：
```

## Phase 2: 指挥决策（Command）

诊断阶段确认根因后进入决策阶段：

1. **构建时间线**：对齐 log / metric / deploy / config change / feature flag / 计划任务 / 外部事件。模板见 [references/time-line-template.md](references/time-line-template.md)。
2. **隔离根因**：沿数据流路径追踪，区分脆弱性与触发动作。
3. **止血方案**：可逆动作（切流/回滚/限流/降级），标注回滚条件与生效时间。
4. **修复路线**：短期（本周，消除触发）→ 中期（本月，加固脆弱性）→ 长期（季度，架构改进）。
5. **观测补齐**：列出 metric / log / trace / 告警缺口，标注优先级和负责方。

## 事故分级

| 级别 | 定义 | 响应要求 | 示例 |
|------|------|---------|------|
| P0 | 核心功能完全不可用，>50% 用户 | 立即 oncall，5min 内 | 支付不可用、登录全阻 |
| P1 | 核心功能严重降级，10-50% 用户 | 15min 内响应 | 搜索慢 10x、订单延迟 |
| P2 | 部分功能异常，<10% 用户 | 1h 内响应 | 个人设置页报错 |
| P3 | 非核心功能异常，无直接用户影响 | 下一个工作日 | 后台报表延迟 |

## 输出模板

```markdown
# 事故响应报告：<incident>

## 事故摘要
[起止时间 / 影响面 / 严重度 / 用户可见症状]

## 诊断过程
[症状 → 候选假设 → 验证步骤 → 排除项 → 锁定根因]

## 时间线
[UTC 时间 → 事件 → 来源]

## 根因分析
[触发动作 / 脆弱性 / 数据流路径 / 证据链]

## 止血方案
[已采取 / 建议采取，含回滚预案]

## 修复路线
[短期 / 中期 / 长期]

## 待补观测
[需新增的 metric / log / trace / 告警]

## 范围限制
[未触达的子系统 / 时间窗 / 数据类型]
```

## 交叉引用

- [`log-analyzer`](../log-analyzer/SKILL.md)：日志对齐与错误上下文关联
- [`monitoring-observability`](../monitoring-observability/SKILL.md)：指标/日志/告警设计
- [`system-diagnostics`](../system-diagnostics/SKILL.md)：Linux 主机健康检查
- [`network-troubleshooter`](../network-troubleshooter/SKILL.md)：网络排障

## 反模式与检查清单

详见 [references/anti-patterns.md](references/anti-patterns.md)。
