## 错误类型选择

| 场景 | 推荐 | 原因 |
|------|------|------|
| 库公共 API | `thiserror` 自定义 enum | 调用方可 match |
| 应用 main/CLI | `anyhow::Result` | 快速聚合，不需下游匹配 |
| 内部模块 | 自定义 struct/enum | 保持可控 |
| 原型/脚本 | `anyhow` 或 `unwrap` | 速度优先 |

代码示例见 [chapter_04.md](references/chapter_04.md)。
