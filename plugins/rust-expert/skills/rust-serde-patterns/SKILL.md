---
name: rust-serde-patterns
description: 用于 Rust serde 序列化/反序列化；当任务涉及 serde derive 属性、enum 标签策略、自定义 Serializer/Deserializer、字段别名、向后兼容演进、flatten 或 skip_serializing_if 时触发。
---

# Rust Serde Patterns

## 适用场景

- 设计 JSON/YAML/TOML 协议消息或配置的序列化方案。
- 选择 enum 标签表示策略。
- 不破坏已有数据地演进结构体字段。
- 编写自定义序列化或反序列化时校验。

## 核心约束

1. `deny_unknown_fields` 只用在 API 入口类型。
2. 枚举默认 `#[serde(tag = "type")]`（internally tagged）。
3. 重命名后保留 `#[serde(alias = "old_name")]`。
4. 新增字段用 `#[serde(default)]` 或 `Option<T>`。
5. 自定义 Deserialize 返回错误不 panic。
6. `flatten` 有性能开销，热路径慎用。
7. 二进制协议用 `#[serde(with = "...")]` 自定义编码。

## 代码模式

- [Internally tagged enum](references/patterns.md#模式-1)
- [向后兼容结构体演进](references/patterns.md#模式-2)
- [自定义序列化 Duration 转毫秒](references/patterns.md#模式-3)
- [反序列化时校验](references/patterns.md#模式-4)

## 检查清单

- enum 标签策略明确？`deny_unknown_fields` 只在入口？
- 重命名保留 alias？新增字段有 default/Option？

## 反模式

- 所有类型加 `deny_unknown_fields`：加字段后旧客户端全挂。
- enum 用 untagged：错误信息极差且有歧义。
- 重命名不加 alias：旧数据无法解析。
- Deserialize 中 panic：畸形输入崩服务。
