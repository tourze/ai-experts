---
name: exhaustive-systems-analysis
description: "在需要对系统做穷举式子系统拆解与问题审计时使用。"
---

# exhaustive-systems-analysis

## 适用场景
- 适合生产前深度审计、代理生成代码复核、复杂模块正确性核查。
- 适合多模块系统的分层、分面分析，而不是单点评价。
- 交叉引用：链路细节用 `api-trace-reader`；接缝与边界问题用 `seam-ripper`。

## 核心约束
- 必须先做子系统拆分，不能一口气混着看。
- 每个发现都要有文件定位、问题类型、严重级别和修复建议。
- 优先审有状态、有副作用、并发、认证、安全边界的模块。
- 不要为了节省上下文把多个子系统混成一句结论。

## 代码模式
- 先产出子系统表：文件范围、侧重点、优先级和副作用。
- 按需套用状态系统、API、并发、UI、数据处理、配置六类检查清单。
- 最终汇总按 `Critical → High → Medium → Low` 排序，给出修复顺序。


## 检查清单
- 是否拆清了子系统、依赖关系和外部副作用。
- 是否对高优先级子系统单独给出发现。
- 是否去重了跨子系统重复发现。
- 是否把“症状”和“根因”分开写。

## 反模式

### FAIL: 一份总评

```md
"系统整体不错，建议加强测试和监控。"
→ 客户："你看了什么？哪些模块是 critical？"
→ 答不上
```

### PASS: 子系统拆解 + 证据

```md
## 子系统清单
| 模块 | 文件范围 | 优先级 | 副作用 |
| auth | src/auth/* | P0 | session, jwt |
| order | src/order/* | P0 | DB, MQ, payment |
| ui | src/components/* | P2 | none |

## 发现（按优先级）
### Critical
- auth/jwt.ts:45 secret 硬编码（src/auth/jwt.ts:45）
### High
- order/service.go:120 缺去重，重复请求会创建多订单
```

### FAIL: 样式问题排前面

```
P1: 文件命名不统一
P2: SQL 注入漏洞 ← 严重错位
```

### PASS: 严格按影响排

```
Critical（数据丢失/泄漏/安全）：SQL 注入
High（功能错误）：竞态条件
Medium（性能 / 可维护）：N+1 查询
Low（风格）：命名规范
```
