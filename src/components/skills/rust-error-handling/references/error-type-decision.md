# Rust 错误类型选择速查

| 场景 | 推荐 | 原因 |
|------|------|------|
| 库公共 API | `thiserror` 自定义 enum | 调用方可 match，API 边界稳定。 |
| 应用 main / CLI | `anyhow::Result` | 快速聚合上下文，不要求下游匹配。 |
| 内部模块 | 自定义 struct / enum | 保持错误来源和转换边界可控。 |
| 原型 / 脚本 | `anyhow` 或局部 `unwrap` | 速度优先，但不要带入生产路径。 |

公共函数返回 `Result` 时同步补 `# Errors`；生产路径中的 `unwrap()` / `expect()` 必须有显式 fail-fast 理由。
