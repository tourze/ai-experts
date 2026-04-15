---
name: protocol-freezing-patterns
description: "在需要管理协议版本冻结、线格式演进、向后兼容、版本协商和 breaking change 流程时使用；覆盖 VPN 协议、RPC 系统、IPC 契约等场景。"
---

# protocol-freezing-patterns

## 适用场景
- 需要冻结已部署协议字段或在不破坏旧客户端前提下演进消息结构。
- 交叉引用：系统级设计配合 `system-design`；错误处理配合 `error-handling-patterns`。

## 核心约束
- 已部署字段的线上表示不可变（类型、位置、编码）。
- 新增字段必须可选且带默认值；旧客户端遇未知字段必须忽略。
- 每条消息携带版本标签或版本化信封。
- 删除字段走四阶段：标记废弃 -> 停写 -> 停读 -> 移除。
- 破坏性变更必须升版本号；禁止同版本下变更语义。
- 扩展点初始设计时预留；协议文档与代码同等冻结。
- 保留每版本 golden file，新代码须能反序列化所有历史版本。

## 代码模式
- 按需读取 `references/versioned-envelope.md`、`references/field-evolution.md`、`references/version-negotiation.md`、`references/golden-file-testing.md`。

## 检查清单
- 每条消息是否有版本标签。
- 新增字段是否可选 + 默认值。
- 废弃字段是否有四阶段计划。
- CI 是否运行历史 golden file 反序列化测试。

## 反模式
- 偷改已部署字段类型不升版本号。
- 新增必填字段导致旧客户端崩溃。
- 用数字枚举，插入新变体后序号错位。
- 删除字段不走四阶段流程直接移除。
