
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
- 从 [模板骨架](../assets/template.html) 起步，不要重新发明渲染骨架。
- 图标、布局和连线语义分别参考 [图标说明](./icons.md)、[布局模式](./layout-patterns.md)、[连接语义](./connections.md)。
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

### FAIL: 一团线

```
[20 个节点 × 80 条线交叉]
→ 用户："谁连谁？哪条是实时哪条是异步？"
```

### PASS: 分层 + 语义颜色

```html
<svg>
  <!-- 实时（蓝实线） -->
  <line class="connection realtime" x1="..." y1="..." />
  <!-- 异步事件（橙虚线） -->
  <line class="connection event" x1="..." y1="..." />
</svg>
<legend>
  实时 = 同步 RPC | 事件 = 异步消息 | 控制 = 配置变更
</legend>
```

### FAIL: 节点只有名字

```html
<div class="node" data-node-id="node-1">UserService</div>
<!-- 用户："这个 UserService 干什么的？谁调它？" -->
```

### PASS: 语义 ID + 描述

```html
<div class="node" data-node-id="user-svc">
  <h4>User Service</h4>
  <p>用户档案 / 认证 / 会话</p>
  <small>API: /users/* | DB: users</small>
</div>
```

### FAIL: 外链 CDN

```html
<link href="https://cdn.example.com/icons.css">
<script src="https://cdn.example.com/d3.js"></script>
<!-- CDN 失效 / 内网无法访问 → 图打不开 -->
```

### PASS: 完全内联

```html
<style>/* 所有 CSS */</style>
<script>/* 所有 JS 内联 */</script>
<!-- 单文件可邮件 / 内网 / 离线打开 -->
```
