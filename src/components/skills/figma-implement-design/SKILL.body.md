## 代码模式

```text
推荐顺序：
1. 解析 fileKey / nodeId 或读取桌面 Figma 当前选区
2. 调用 get_design_context 获取结构化设计数据
3. 调用 get_screenshot 获取视觉对照
4. 下载设计稿返回的图片 / SVG 资产
5. 映射到项目组件、token、样式体系
6. 逐状态自测：默认、hover、focus、disabled、loading
```

```tsx
// 先用项目 token 和组件表达设计稿，而不是直接复制 Figma 生成类名
<Button variant="primary" size="lg" className="w-full">
  立即开始
</Button>
```

Figma MCP 文档：https://developers.figma.com/docs/figma-mcp-server/
