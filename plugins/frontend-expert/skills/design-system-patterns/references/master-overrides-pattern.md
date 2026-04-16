# Master + Overrides 持久化范式

在 AI 协作场景下（Claude Code / Cursor 等）设计系统决策会跨多个会话复用。把设计系统落到可被 AI 读取的 Markdown 文件，比留在聊天记录里更可靠。

## 目录结构

```
design-system/
├── BRAND.md                   # 品牌层：受众、语气、人格、反参考（变化慢）
├── MASTER.md                  # 系统层：全局 token、字体、反模式（变化中）
└── pages/
    ├── dashboard.md           # 页面层：dashboard 相对 MASTER 的**覆盖项**
    ├── checkout.md            # 页面层：checkout 覆盖项
    └── onboarding.md
```

## 三层职责

| 层 | 写什么 | 不写什么 | 变化频率 |
|---|---|---|---|
| `BRAND.md` | 目标受众、使用场景、3 个品牌词、语气、反参考（看起来**不应该**像谁） | 具体 token、组件 API | 慢（一次定好可月/年不变）|
| `MASTER.md` | 全局色/间距/字体/圆角/阴影 token、风格主基调、通用反模式 | 一次性页面样式、brand 层的语气描述 | 中（季度维度）|
| `pages/<name>.md` | 这个页面**偏离** MASTER 的地方 + 偏离原因 | 重复 MASTER 已有的内容、重复 BRAND 语气 | 快（每次迭代）|

**为什么分 BRAND 和 MASTER**：品牌层（我是谁、给谁用）和系统层（具体 token）变化频率完全不同。合成一个文件每次改 token 都要重读品牌定义，分开后 BRAND 几乎只读、MASTER 按需改。

## 检索规则（给 AI 的指令模板）

当 AI 开始实现某个具体页面时，按以下顺序拼上下文：

```
我在实现 [页面名] 页面。请按顺序读：
1. design-system/BRAND.md（品牌层：受众、语气、反参考）——必读
2. design-system/MASTER.md（系统层：token、字体、反模式）——必读
3. design-system/pages/[页面 slug].md（页面层覆盖）——如存在，按此覆盖 MASTER 同字段
然后开始编码。任何决定都不能违反 BRAND.md 的反参考。
```

## BRAND.md 建议结构

```markdown
# Brand · <品牌名>

## 1. Audience & Context
- 主要用户：<人群 + 使用场景>
- 次要用户：<人群>
- 使用时刻：<晨间通勤 / 深夜加班 / 周末探店 / …>
- 使用设备：<手机为主 / 桌面为主 / 平板 / …>

## 2. Voice & Tone
三个具体品牌词（不用 "modern/elegant/professional" 死词）：
- <例：warm + mechanical + opinionated>
- <例：calm + clinical + careful>

语气档位：正式 / 友好 / 权威 / 技术（选一种）
第一人称用法：We / I / 品牌名
第二人称用法：You / 您 / 你

## 3. Anti-References（反参考）
看起来**不应该**像下面任何一个：
- <具体竞品或产品 URL> — 因为 <具体原因>
- <某类 AI 模板外观> — 因为 <具体原因>

## 4. Physical Object（辅助联想）
如果品牌是一个实物，它是什么？
<例：博物馆展品标签 / 手缝布标 / 1970 大型机手册封面>
```

BRAND.md 的作用：让 LLM 在自由生成时有"品牌硬约束"可对齐，避免每个页面各自飘移。

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

- Master + Overrides 基本范式参考 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 `--persist` 做法。
- BRAND.md 层（品牌/受众/反参考/语气）概念参考 `pbakaus/impeccable` (Apache-2.0) 的 `.impeccable.md` 和 Context Gathering Protocol。
- 两者都经过重写与合并，适配我们的三层结构和 skill 交叉引用体系。
