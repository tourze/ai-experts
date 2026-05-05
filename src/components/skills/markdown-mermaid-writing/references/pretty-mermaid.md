# Pretty Mermaid 渲染

将 Mermaid 源码渲染为主题化 SVG 或终端 ASCII 图。

## 使用场景

- 需要从 Mermaid 源码产出可直接嵌入文档的 SVG 图。
- 需要终端兼容的 ASCII 版本（用于纯文本环境）。

## 渲染工具

优先使用 `mermaid-cli`（`mmdc`）渲染 SVG；终端场景用 `mermaid.ink` API 或本地 ASCII 转换工具。

```bash
mmdc -i diagram.mmd -o diagram.svg -t neutral
```

## 主题配置

- 默认 `neutral` 主题适合文档嵌入。
- 暗色文档可选 `dark` 主题。
- 自定义主题 JSON 可覆盖颜色、字体和边框。

## 约束

- 复杂图优先拆分，避免单张 SVG 超过 2000px。
- ASCII 版本仅保留关键结构，省略装饰元素。
