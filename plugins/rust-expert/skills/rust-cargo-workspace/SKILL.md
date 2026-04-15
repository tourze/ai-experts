---
name: rust-cargo-workspace
description: 当用户需要管理 Cargo workspace 时使用；涉及 [workspace]、workspace.dependencies、feature flag 或 crate 拆分时触发。
---

# Rust Cargo Workspace

## 适用场景

- 新建/重构 Rust monorepo，规划成员和共享依赖。
- 设计 feature flag 跨 crate 传播策略。
- 编写 `build.rs` 或规划 CI 缓存。

## 核心约束

1. 共享依赖放 `[workspace.dependencies]`；成员用 `dep.workspace = true`。
2. edition 2021+ 必须 `resolver = "2"`。
3. feature 必须 additive：启用只增功能不减。
4. 未发布成员 path 依赖；已发布 crate 版本号依赖。
5. `build.rs` 只写 `OUT_DIR`，禁写 `src/`。
6. 跨 crate 集成测试放专用 test crate。
7. CI 用 `--workspace` 全局检查。

## 代码模式

- [Workspace Cargo.toml 配置](references/patterns.md#模式-1)
- [Feature flag 跨 crate 组合](references/patterns.md#模式-2)
- [build.rs 代码生成](references/patterns.md#模式-3)
- [CI workflow 与缓存](references/patterns.md#模式-4)

## 检查清单

- `resolver = "2"` 已设？共享依赖全在 workspace 级？
- feature 全 additive？`build.rs` 只写 `OUT_DIR`？

## 反模式

- 各成员各写版本号：不一致且重复编译。
- 不设 `resolver = "2"`：dev-deps feature 泄漏。
- feature 做减法：启用反而丢功能。
- `build.rs` 写 `src/`：只读环境直接失败。
