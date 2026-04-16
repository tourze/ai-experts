# 反 Reflex 字体协议

`pairings-catalog.md` 给的是**可靠起点**——90% 的项目可以直接用。但如果项目要**品牌差异化**（营销官网、设计师作品集、艺术品牌、反共性产品），默认清单会生成新的"模板感"。

这时用下面的"反 reflex" 流程**推翻**目录推荐。

## 何时应用本协议

**必须应用**：
- 设计师/创意机构官网
- 品牌强差异化的营销页
- Gen-Z / 亚文化 / 艺术类产品
- 用户明确说"不要 AI 味""不要模板感""要独特感"

**不应用**：
- B2B SaaS / 企业工具 / Dashboard / 后台（套版反而是优点）
- 文档站、内部工具、MVP、纯 UX 流程
- 用户明确说"快速稳妥出活"

## Step 1：写 3 个具体品牌词

不要写"modern / elegant / premium / clean"这类死词——它们对所有项目都成立，所以对任何项目都没用。

写**具体+物理**的词组，例：
- ✅ "warm + mechanical + opinionated"
- ✅ "calm + clinical + careful"
- ✅ "fast + dense + unimpressed"
- ✅ "handmade + a little weird"
- ❌ "modern + sleek + professional"

## Step 2：列出 LLM 反射会推荐的字体（然后拒绝它们）

下面 20 个字体是 2024-2025 年 LLM 的**默认反射**。如果你脑子里刚跳出来的就是其中之一，**拒绝它**然后继续找：

```
REFLEX FONTS — REJECT IF THEY APPEAR FIRST:

Serif: Fraunces, Newsreader, Lora, Crimson, Crimson Pro, Crimson Text,
       Playfair Display, Cormorant, Cormorant Garamond, DM Serif Display,
       DM Serif Text, Instrument Serif

Sans:  Inter, DM Sans, Plus Jakarta Sans, Outfit, Instrument Sans, Syne

Mono:  IBM Plex Mono, Space Mono, Space Grotesk

Plex:  IBM Plex Sans, IBM Plex Serif (all IBM Plex variants)
```

**注意**：这份列表和 `pairings-catalog.md` 里多个推荐有直接冲突。这是有意的——pairings-catalog 是"起点"，本协议是"推翻起点"。

## Step 3：物理对象启发式

选字体不要想"这是什么风格"，想"这是什么**物理物件**"：

- 1970 年代大型机终端手册
- 外套内衬上缝的布标
- 手绘理发店招牌
- 博物馆展品标签
- 廉价报纸印的童书
- 打字机色带盒上的油墨字
- 税单
- 车库金属工具柜贴纸
- 地下漫画杂志封面
- 胶片罐侧面的手写标签

**挑选流程**：上面哪个物件最像这个品牌？去该物件所属的**字体来源**找（不是 Google Fonts 主目录）：

| 物件感 | 字体来源 |
|---|---|
| 怀旧/印刷品 | Pangram Pangram, Velvetyne, Future Fonts |
| 专业/精工 | Klim Type Foundry, Commercial Type, ABC Dinamo |
| 实验/艺术 | Velvetyne, Ohno Type Co, Occupant Fonts |
| 手工/有机 | Collletttivo, Future Fonts early access |
| 系统/界面 | Adobe Fonts（商用需授权） |

## Step 4：Cross-check（自我反射测试）

挑完之后问自己 3 个问题：

1. **这是我的反射答案吗？** 如果是，回 Step 3 再找。
2. **它和 REFLEX list 里任何一个"很像"吗？** 如果是（比如挑了 Recoleta，它"很像 Fraunces"），回 Step 3。
3. **如果给同一品牌一个 LLM 跑 5 次，它会跳出这个字体吗？** 如果会，就还是反射。

## Step 5：常见陷阱

- ❌ **"serif = warm/premium"公式**：premium 品牌可以用 Swiss 中性 sans（Untitled Sans, GT Haptik），也可以用 grotesk（Söhne），甚至可以用 mono（Berkeley Mono）。不是非要 serif。
- ❌ **"tech = sans-serif"公式**：最反工程的决定是给 dev tool 配 serif（看 Linear 早期、Vercel 的 Geist 之前）。
- ❌ **"children = rounded display"公式**：真童书从来不用 Fredoka——它们用真实的书籍字体。
- ❌ **"modern = geometric"公式**：2026 年最"现代"的决定是**不用别人都在用的字体**。

## 和 pairings-catalog 的关系

| 场景 | 用哪个 |
|---|---|
| B2B SaaS / Dashboard / Admin / 快速稳妥 | `pairings-catalog.md`（直接查表） |
| 品牌差异化 / 创意 / Gen-Z / 反套版 | 本协议（推翻目录推荐，走 Step 1-5） |
| 中文项目 | pairings-catalog 里找拉丁西文 fallback，中文按品牌另挑 |
| 评审现有字体选择 | 先过本协议的 REFLEX list；命中则标记为"反射嫌疑" |

## 致谢

本协议参考 `pbakaus/impeccable` (Apache-2.0) 的 `font_selection_procedure` 和 `reflex_fonts_to_reject` 观点，物理对象启发式和 cross-check 步骤经过重写与扩充。
