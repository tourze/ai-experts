# coding-expert

通用编码守卫插件，提供语言无关的代码质量防护。

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `encoding-guard` | BOM 检测 + 非 UTF-8 字节序列检测（覆盖所有主流语言扩展名） |

## 设计原则

本插件只收录**语言无关**的通用守卫。语言/框架特定的检查（PHP 语法、PHPStan、Doctrine Entity 等）属于对应的 `*-expert` 插件。

## 安装

```bash
claude --plugin-dir /path/to/plugins/coding-expert
```

建议与语言专用插件（`php-expert`、`symfony-expert` 等）配合使用。
