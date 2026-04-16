# Master + Overrides 持久化范式

在 AI 协作场景下（Claude Code / Cursor 等）设计系统决策会跨多个会话复用。把设计系统落到可被 AI 读取的 Markdown 文件，比留在聊天记录里更可靠。

## 目录结构

```
design-system/
├── MASTER.md                  # 全局 Source of Truth（token、风格、字体、反模式）
└── pages/
    ├── dashboard.md           # 仅记录 dashboard 相对 MASTER 的**覆盖项**
    ├── checkout.md            # 仅记录 checkout 的覆盖项
    └── onboarding.md
```

## 分层职责

| 层 | 写什么 | 不写什么 |
|---|---|---|
| `MASTER.md` | 品牌色、字体对、圆角/阴影体系、通用反模式、风格主基调 | 某个页面的一次性颜色、临时组件变体 |
| `pages/<name>.md` | 这个页面**偏离** MASTER 的地方及原因 | 重复 MASTER 已有的内容 |

## 检索规则（给 AI 的指令模板）

当 AI 开始实现某个具体页面时，按以下顺序拼上下文：

```
我在实现 [页面名] 页面。请先读 design-system/MASTER.md。
然后检查 design-system/pages/[页面 slug].md 是否存在：
- 存在：以该文件规则覆盖 MASTER 同字段。
- 不存在：只按 MASTER 落地。
然后开始编码。
```

## MASTER.md 建议结构

```markdown
# Design System · <品牌名>

## 1. Style Direction
主风格：<见 ui-style-catalog>
辅风格：<≤ 1 个，仅局部>

## 2. Color Tokens
- --color-brand: #...
- --color-accent: #...
- --color-surface: #...
- （按 semantic 分层，原始值 → 语义值）

## 3. Typography
- Display: <字体>（<字重>）
- Body: <字体>（<字重>）
- Mono: <字体>（可选）

## 4. Spacing / Radius / Shadow
- spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
- radius: sm=4 md=8 lg=16 xl=24
- shadow: 1=... 2=... 3=...

## 5. Motion
- duration: fast=150ms base=200ms slow=300ms
- easing: cubic-bezier(0.2, 0.8, 0.2, 1)
- 尊重 prefers-reduced-motion

## 6. Anti-patterns
- 不使用 AI 紫粉渐变
- 不使用 emoji 作图标
- ...
```

## pages/<name>.md 建议结构

```markdown
# Overrides · Dashboard

## 为什么需要覆盖
Dashboard 数据密度远高于营销页，需要更紧凑的间距和更低饱和的色彩。

## Overrides
- spacing base: 12 → 8（更紧凑）
- radius lg: 16 → 8（卡片更理性）
- accent 仅用于 trend up/down indicator，不用在 CTA
- 字体：Display 字体不出现（Dashboard 不需要营销感）

## 新增
- `--chart-positive: #10B981`
- `--chart-negative: #EF4444`
```

## 何时不要用这个模式

- 单页或原型阶段，还没稳定 token —— 直接在代码里迭代更快。
- 只有 1-2 个页面的小网站 —— 一个 MASTER.md 就够。
- 团队不使用 AI 协作 —— 这个模式的主要收益是给 AI 可读的上下文。

## 和我们现有 skill 的关系

- token 分层规则见 [design-tokens.md](design-tokens.md)。
- 主题切换规则见 [theming-architecture.md](theming-architecture.md)。
- 组件 API 稳定性见 [component-architecture.md](component-architecture.md)。
- MASTER 的 Style Direction 应引用 [ui-style-catalog](../../../../creative-expert/skills/ui-style-catalog/SKILL.md)。
- MASTER 的 Fonts 应引用 [font-pairing-library](../../font-pairing-library/SKILL.md)。
- MASTER 的 Color Tokens 应引用 [industry-design-presets](../../industry-design-presets/SKILL.md) 对应行业预设。

## 致谢

该范式参考 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 `--persist` + Master + Overrides 设计系统持久化做法，概念经过重写，适配我们的 skill 交叉引用体系。
