# 字体搭配目录

按**语气**分组，共 45 对。每条给出：标题字 / 正文字 / 语气关键词 / 最佳场景 / Google Fonts URL。

> Google Fonts URL 形如 `https://fonts.google.com/share?selection.family=Fraunces:...` 较长，本表省略到 `fonts.google.com/share?...`，使用时去 Google Fonts 官网 `Get font → Get embed code` 生成完整 `@import` 语句。

## Elegant / Editorial（优雅 · 编辑向）

| # | Display | Text | 语气 | 最佳场景 |
|---|---|---|---|---|
| 1 | Fraunces | Inter | Elegant, modern serif with warmth | Editorial SaaS, premium blog, modern luxury |
| 2 | Playfair Display | Source Sans Pro | Classic editorial, high contrast | Magazine, wedding, fashion |
| 3 | Cormorant Garamond | Montserrat | Sophisticated, spa-like | Beauty, wellness, luxury service |
| 4 | Libre Caslon Text | Lato | Traditional book feel | Law, consulting, heritage brand |
| 5 | Cardo | Source Sans 3 | Academic, literary | University, publishing, research |
| 6 | EB Garamond | Inter | Timeless, readable serif | Philosophy, long-form content |
| 7 | Tenor Sans + Lora | Lora | Refined serif/sans contrast | Boutique hotel, gallery |

## Modern / Clean Sans（现代 · 干净 Sans）

| # | Display | Text | 语气 | 最佳场景 |
|---|---|---|---|---|
| 8 | Inter | Inter | Mono-family, functional | Enterprise SaaS, dashboard |
| 9 | Geist | Geist Mono | Vercel-style minimal | Developer tools, AI SaaS |
| 10 | Manrope | Inter | Geometric, warm | Modern SaaS, fintech |
| 11 | Space Grotesk | Space Mono | Modern + technical mono | Web3, crypto, indie dev tool |
| 12 | DM Sans | DM Sans | Slightly humanist | Startup, marketing site |
| 13 | Plus Jakarta Sans | Inter | Rounded modern sans | Product landing, app store |
| 14 | Satoshi (Indie) → Onest (free alt) | Onest | Modern neo-grotesk | Premium SaaS |
| 15 | IBM Plex Sans | IBM Plex Serif | Corporate techy | B2B, enterprise tech |

## Bold / Brutalist（大声量 · 粗砺）

| # | Display | Text | 语气 | 最佳场景 |
|---|---|---|---|---|
| 16 | Archivo Black | Archivo | High-impact poster | Agency, portfolio, statement page |
| 17 | Anton | Roboto | Newspaper headline | Sports, news, campaign |
| 18 | Bebas Neue | Open Sans | Tall condensed display | Event, poster, music |
| 19 | Unbounded | Inter | Oversized futurist | Web3, launch page |
| 20 | Syne | Inter | Brutalist geometry | Design portfolio, agency |
| 21 | Clash Display (Indie) → Khand (free alt) | Khand | Modern condensed bold | Tech conference, brand |
| 22 | Big Shoulders Display | Big Shoulders Text | Newsprint brutalist | Editorial, activist brand |

## Playful / Friendly（亲和 · 玩味）

| # | Display | Text | 语气 | 最佳场景 |
|---|---|---|---|---|
| 23 | Fredoka | Nunito | Rounded, childlike | EdTech kids, playful app |
| 24 | Quicksand | Quicksand | Soft rounded | Wellness, meditation |
| 25 | Poppins | Poppins | Friendly geometric | Small business, local service |
| 26 | Rubik | Rubik | Rounded corners | Startup, consumer app |
| 27 | Gluten | Nunito | Variable playful display | Creative studio, kids brand |
| 28 | Caprasimo | DM Sans | Slab display, warm | Food, bakery, lifestyle |

## Retro / Vintage（复古）

| # | Display | Text | 语气 | 最佳场景 |
|---|---|---|---|---|
| 29 | Abril Fatface | Lato | Didone poster | Fashion, boutique |
| 30 | Bodoni Moda | Libre Franklin | High-contrast didone | Luxury, fashion editorial |
| 31 | DM Serif Display | DM Sans | Modern didone | Modern luxury, SaaS with class |
| 32 | Alfa Slab One | Open Sans | Vintage slab | Diner, brewery, barbershop |
| 33 | Rye | Merriweather | Old-west display | Whiskey, western theme |
| 34 | Monoton | Space Mono | Neon / Y2K | Music, nightclub, arcade |
| 35 | Pacifico | Quicksand | 50s script | Cafe, bakery, handmade |

## Technical / Data / Code（技术 · 数据）

| # | Display | Text | Mono | 最佳场景 |
|---|---|---|---|---|
| 36 | JetBrains Mono | Inter | JetBrains Mono | Developer tool, CLI doc |
| 37 | Space Mono | Inter | Space Mono | Web3, crypto, indie |
| 38 | IBM Plex Mono | IBM Plex Sans | IBM Plex Mono | Enterprise dev tool, internal platform |
| 39 | Fira Code | Fira Sans | Fira Code | Code editor, technical blog |
| 40 | Geist Mono | Geist | Geist Mono | Modern AI/infra SaaS |

## Humanist / Warm Serif（人文 · 温润衬线）

| # | Display | Text | 语气 | 最佳场景 |
|---|---|---|---|---|
| 41 | Newsreader | Inter | Reading-first serif | Long-form, newsletter |
| 42 | Source Serif 4 | Source Sans 3 | Adobe humanist pair | Doc site, research |
| 43 | Literata | Inter | Google Books serif | Reading app, publishing |
| 44 | Vollkorn | Work Sans | Modern book | Blog, magazine |
| 45 | Crimson Pro | Inter | Humanist serif, warm | Newsletter, personal site |

## 使用建议

- **先语气，再字体**：从上表某一组里选 2-3 对做 A/B 视觉测试。
- **variable font 优先**：Fraunces / Inter / Onest / Geist / Unbounded 都是 variable，一次加载覆盖多字重。
- **商业字体注意**：Satoshi / Clash Display 等 Indie 字体需要 Fontshare 授权，本表已给出 Google Fonts 替代。
- **中文搭配**：上表以拉丁字体为主。中文项目建议正文用 `"PingFang SC", "HarmonyOS Sans", system-ui`；标题中文可用 [霞鹜文楷 / LXGW WenKai](https://github.com/lxgw/LxgwWenKai) 或思源宋体/黑体。拉丁字体作为次级西文 fallback。
- **字重对齐**：Display 固定用 700 或 800 一档；Text 用 400 正文 + 600 强调；避免一个字体里用 4 档以上。

## 致谢

本目录参考了 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 typography 数据结构思路，内容经过重写、筛选和补充。
