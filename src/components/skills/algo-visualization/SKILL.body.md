不适用：

- 静态图导出（PNG/SVG）→ `canvas-design`
- 动画视频 → 使用视频生成工具
- 业务数据图表 → `data-visualization`
- 流程图 / 时序图 / 状态图 → `markdown-mermaid-writing`
- 一页艺术化静态画面 → [canvas-design](../canvas-design/SKILL.md)

## 5 条铁律（违反任一 = 不合格）

1. **正文为主**：80%+ 是 `<p>` + `<h2>`/`<h3>`；callout（`.info`/`.warn`/`.ok`/`.def`/`.formula`）整页 ≤ 4 个；定义/公式用 `<p>` + `<b>`，不塞 `.def`/`.formula` 框。
2. **SVG 不重叠**：相邻圆心距 ≥ 56px，父子 y 间距 ≥ 60px，**viewBox 高 = max(节点 y + r) + 40**。宁可加大 viewBox，不压缩间距。
3. **代码联动**：涉及代码时每个 step 必须有 `line` 字段；用 `.code-panel` + `.cl.on` 高亮；render 末尾调 `hlLines('codeId', s.line)`；代码与动画双面板。
4. **每个概念配 SVG**：节奏=讲完概念 → 紧跟 SVG → 再接文字；整页静态 SVG 数 ≥ 交互动画数。
5. **跟随来源脉络**：有 PDF 时按原文页面顺序与例子；无来源按"是什么 → 怎么工作 → 实例 → 总结"。

详见 [references/iron-rules.md](references/iron-rules.md)。

## 决策树

### 输入 → 工作流

| 输入 | HTML 骨架 | JS 模板 | 关键 |
|---|---|---|---|
| PDF / 教材 | 结构 2 | A 或 B | 顺原文章节 + 静态 SVG + 1-2 动画 |
| 主题 / 算法（无代码） | 结构 2 | A 或 B | 概念 SVG + 操作动画 |
| 代码 / 算法（含代码） | **结构 1**（必须） | A + `hlLines` | 双面板联动（铁律 3） |
| 概念对比 | 结构 2 ×2 | 任选 | `.compare` 并排 |

### 数据形态 → JS 模板

| 形态 | 选 |
|---|---|
| 数组 + 完全二叉树（堆、堆排序） | 模板 A |
| 树形不规则（哈夫曼、BST 旋转、删除形变） | 模板 B（手算坐标，严守铁律 2） |
| 只有数组（冒泡/选择/插入/队列/栈） | 模板 C |

## 嵌入要点

`assets/` 三件套必须 **Read 原样读入**，不 paraphrase。`assets/boilerplate.js` 按块摘取（工具函数 → A/B/C 三选一 →（如需）`hlLines` → 键盘导航 → 自己的 `steps`），**不要整文件复制**——模板 A 和 C 都声明顶层 `var steps`，重复声明会 `SyntaxError`。模板 A 必须自定义 `clsFn(i)`，模板 B 必须自写驱动层。

完整骨架、嵌入顺序、分块写入策略 → [references/page-skeleton.md](references/page-skeleton.md)。
steps 数据形状与颜色语义 → [references/steps-shapes.md](references/steps-shapes.md)。
Red Flags 与 Rationalizations → [references/rationalizations.md](references/rationalizations.md)。
444 行参考实现 → `references/heap_overview.html`。

## 来源

`assets/` 与 `references/heap_overview.html` 来自 [L0dyv/claude-algo-visualize](https://github.com/L0dyv/claude-algo-visualize)（MIT）。详见 [references/SOURCE.md](references/SOURCE.md)。
