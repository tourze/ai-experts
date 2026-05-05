# Absolute Bans（CSS 模式级硬禁令）

审查设计稿或生成代码时，下面这些 CSS 模式**永远不可接受**——它们是 AI 设计的"指纹"。发现后**不要改颜色/宽度绕开**，要**换完全不同的结构重写**。

## BAN 1：侧条边框（side-tab accent）

**模式**：`border-left` 或 `border-right` 宽度 ≥ 2px 作为颜色强调条。

```css
/* ❌ 全部禁止，无论颜色 / 宽度 / 变量名 */
.card         { border-left: 3px solid red; }
.alert        { border-left: 4px solid #f59e0b; }
.item         { border-left: 4px solid var(--color-warning); }
.callout      { border-left: 5px solid oklch(0.6 0.18 250); }
.list-item    { border-left: 2px solid var(--primary); }
```

**为什么**：这是 admin / dashboard / medical UI 过度使用的"设计触点"，无论颜色/圆角/不透明度/变量名，都读作"AI 默认"。

**正确重写**（不要只是换成 `box-shadow: inset`，那只是换马甲）：
- 用**完整边框**（`border: 1px solid`）+ 背景微染
- 用**前置编号或图标**（1. / ⚠）传递等级
- 用**背景色 tint**（`background: oklch(0.95 0.02 var(--hue))`）
- 或者**不加视觉指示**——层级靠字体和缩进做

## BAN 2：渐变文字（gradient text）

**模式**：`background-clip: text`（或 `-webkit-background-clip: text`）+ 任何 gradient 背景。

```css
/* ❌ */
.hero-title {
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-number {
  background: radial-gradient(circle, var(--a), var(--b));
  background-clip: text;
}
```

**为什么**：装饰性而非表达性；2024-2025 年 AI 生成的三大指纹之一。实际用户不会因此觉得这页更好，只会觉得"这也是 AI 做的"。

**正确重写**：
- 纯色文字 + 字重加强（`font-weight: 700-800`）
- 纯色文字 + 字号放大（`font-size: clamp(2rem, 6vw, 5rem)`）
- 纯色文字 + 字间距微调（`letter-spacing: -0.02em` 负值让大标题紧实）

## BAN 3：纯黑背景 + 霓虹光晕（dark glow）

**模式**：`background: #000` 或 `oklch(0 0 0)` + `box-shadow` 用高饱和紫/青/粉 + `text-shadow` glow。

```css
/* ❌ 典型 AI dark mode 指纹 */
.hero {
  background: #000;
  box-shadow: 0 0 80px rgba(139, 92, 246, 0.5);
}
.cta {
  box-shadow: 0 0 20px #22d3ee, 0 0 40px #ec4899;
}
```

**为什么**：一看就是"AI 觉得这样酷"。真实 dark mode 用 `oklch(0.12-0.18 ...)` 的深灰、靠 surface 亮度分级而非光晕。

**正确重写**：
- 深灰背景 `oklch(0.14 0.01 var(--brand-hue))`
- 阴影改为**环境光暗阴影** `box-shadow: 0 4px 12px rgba(0,0,0,0.4)`
- accent 用"彩色边框 1px"而非发光

## BAN 4：AI 色盘（purple-to-blue / cyan-on-dark）

**模式**：
- `linear-gradient(..., purple, blue)` 或 `#8b5cf6` + `#3b82f6` 组合
- 深色底 + 青 `#22d3ee` 点缀作为唯一 accent

```css
/* ❌ */
.hero-bg { background: linear-gradient(135deg, #8b5cf6, #3b82f6, #ec4899); }
.card    { background: #0f172a; border: 1px solid #22d3ee; }
```

**为什么**：2023-2024 所有 AI 工具营销页的模板。出现即 AI 标识。

**正确重写**：从品牌本身选 hue，不用这两组反射色。

## BAN 5：统一卡片网格（Hero-Metric layout）

**模式**：`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` + 每格都是「图标 + 大数字 + 小标签 + 支撑文本 + 渐变 accent」。

**为什么**：SaaS 营销页 1:1 AI 生成指纹。每家都长一样。

**正确重写**：
- **打破网格一致性**：有些卡片跨 2 列，有些单列，视觉重心不均
- **卡片内部结构不同**：数字卡 / 引用卡 / 图示卡 / 文字卡 混排
- **去掉每格都有的"图标 + 标题 + 文本"三连**

## BAN 6：Inter + 紫蓝渐变 + 大圆角 + 深色英雄区（AI-4-in-1）

**模式**：`font-family: Inter` + 紫蓝 linear-gradient 背景 + `border-radius: 16-24px` 大圆角 + 深色 hero + 柔光阴影。

**为什么**：四件套一起出现 = 无疑的 AI 生成。单独出现还能救，一起出现直接判死。

**正确重写**：至少打破其中 2 件——换字体（见 [font-pairing-library/anti-reflex-protocol](../../font-pairing-library/references/anti-reflex-protocol.md)）、改色盘、调圆角（8px 方正或 32px+ 极端圆角）、或浅色 hero。

## BAN 7：乱塞装饰 sparkline / 迷你图

**模式**：卡片角落塞不承载数据的迷你折线（纯装饰，走向毫无意义）。

```tsx
/* ❌ */
<Card>
  <MiniSparkline data={fakeWaveData} /> {/* 装饰用，数据无意义 */}
</Card>
```

**为什么**：看上去"像 BI 产品"，实际传递 0 信息，占用视觉权重。

**正确重写**：要么用**真实数据**的迷你图（销售 7 天、注册 30 天），要么**删掉**。

## BAN 8：多层嵌套卡片

**模式**：`<Card><Card><Card>...</Card></Card></Card>`——卡片里嵌卡片。

**为什么**：视觉噪音，每层阴影/圆角堆叠，用户无法建立层级。

**正确重写**：扁平化。外层容器改用**背景 tint + 间距**（`padding` + `background: surface-2`），里面直接放内容，不要再包 `<Card>`。

## BAN 9：一切居中（everything-centered）

**模式**：`text-align: center` + `margin: 0 auto` 应用到每一个容器/section。

**为什么**：全居中层级全丢、读感像 PPT、移动端更糟。

**正确重写**：左对齐为主 + 不对称构图；仅 hero 标题、空态等单元素居中。

## BAN 10：Modal 滥用

**模式**：每个次要操作都弹 modal。

**为什么**：modal 是打断，不是功能面板。用户在 modal 里做事会丢失页面上下文。

**正确重写**：用 **inline expand**、**side sheet**、**独立页面** 替代。保留 modal 给**真正中断**的场景（确认删除、强制登录过期提示）。

## 审查工具链

- **人工过一遍本清单**：最重要的 BAN 1-4 先过。
- **用 `npx impeccable detect src/`**（Apache-2.0 CLI）做静态扫描，命中 25 条模式（side-tab / gradient-text / ai-color-palette / dark-glow / nested-cards / bounce-easing / cramped-padding / ...）。零工程成本，我们直接调用外部工具。
- 命中即标记为 **P0 阻塞项**——不能改颜色/宽度绕开，必须换结构重写。

## 致谢

本清单参考 `pbakaus/impeccable` (Apache-2.0) 的 `<absolute_bans>` 和 25 条检测规则，内容经过重写并加入中文场景注释与替代方案说明。
