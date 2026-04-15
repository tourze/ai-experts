---
name: architecture-diagram
description: "在需要生成自包含 HTML 架构图时使用。"
---

# architecture-diagram

## 适用场景
- 适合系统拓扑图、部署图、网络图、平台组件图和分层架构图。
- 适合把用户提供的组件、区域和连接关系整理成可分享 HTML 图。
- 交叉引用：如果用户要架构评审，改用 `architecture-reviewer`；如果要完整蓝图文档，配合 `architecture-blueprint-generator`。

## 核心约束
- 输出必须是单文件 HTML，图标、样式和连接渲染都要内联。
- 节点必须包含语义化 `data-node-id`、标题和描述；不要生成 `node-1` 这类无意义 ID。
- 只为真实存在的连接类型生成图例，连接颜色和语义必须一致。
- 区域嵌套最多到 4 层，超过时要合并或拆图，不要硬塞。

## 代码模式
- 从 [模板骨架](assets/template.html) 起步，不要重新发明渲染骨架。
- 图标、布局和连线语义分别参考 [图标说明](references/icons.md)、[布局模式](references/layout-patterns.md)、[连接语义](references/connections.md)。
- 优先先整理“区域 → 节点 → 连接”三张表，再落到 HTML。

```bash
cp assets/template.html ./architecture-diagram.html
```

## 检查清单
- 是否为每个节点补齐标题、描述、图标和唯一 ID。
- 是否校验了区域层级、列数和节点分布。
- 是否按连接语义选择 `realtime`、`batch`、`event`、`control` 或 `default`。
- 是否确认输出文件无需任何外部资源即可打开。

## 反模式
- 把关系复杂度推给用户，用一团线代替说明。
- 节点只有名字，没有描述和职责。
- 使用外链图片、外链字体或 CDN 脚本。
- 为了好看强行省略真实连接或区域边界。
