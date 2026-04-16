---
name: font-pairing-library
description: 当用户要选择字体搭配、为页面确定标题/正文字体组合、查询 Google Fonts 导入语句或需要按情绪/行业找字体对时使用。适合"帮我挑一组字体""这个页面该用什么字体""优雅/现代/复古的字体搭配"等场景。
---

# 字体搭配库

## 适用场景

- 为落地页、官网、后台、App 选定 标题 + 正文 字体对。
- 不知道"哪两个字体放一起好看"，需要按情绪/行业查表。
- 需要一个可直接复制的 Google Fonts 导入或 `@import` 语句。
- 与 [design-system-patterns](../design-system-patterns/SKILL.md) 的 typography token 联动定义字体系统。
- 明细清单查 [references/pairings-catalog.md](references/pairings-catalog.md)。

## 核心约束

- 字体数量 ≤ 2 套：1 Display + 1 Text；有强诉求时可加 1 Mono，总数不超过 3。
- 字重档位 ≤ 3 档：Display 常用 700/800；Text 常用 400/500/600。多余字重会显著增加加载体积。
- 有 variable font 就用 variable font，避免分多个 static file 请求。
- Display 字体**不要**用于正文；Text 字体**不要**用于超大标题，会显得无气质。
- 决定字体前先决定**语气**（优雅 / 现代 / 复古 / 技术 / 亲和 / 权威），再据语气查表。
- 字体选择必须与 [design-system-patterns](../design-system-patterns/SKILL.md) 的 token 分层对齐，避免在组件里直接写 `font-family`。

## 实施步骤

### 步骤 1：提取语气关键词

从需求里抽出 1-2 个主语气词（见下表），不要只说"现代"这类空泛词。

| 语气类别 | 可选关键词 |
|---|---|
| Elegant | elegant, editorial, luxury, serif, sophisticated |
| Modern | modern, clean, sans, minimal, tech |
| Playful | playful, friendly, rounded, soft, warm |
| Bold | bold, brutalist, grotesk, heavy, statement |
| Retro | retro, vintage, y2k, nostalgic, handwritten |
| Technical | mono, code, technical, developer, data |

### 步骤 2：查表挑 2-3 个候选

翻 [references/pairings-catalog.md](references/pairings-catalog.md) 按语气列找候选；优先选 variable font 配对。

### 步骤 3：落地到设计系统

生成 token 和 import 语句，而不是散落在组件里。

## 代码模式

### FAIL：字体直接写在组件里，字重失控

```tsx
<h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900 }}>
  Welcome
</h1>
<p style={{ fontFamily: 'Inter', fontWeight: 350 }}>...</p>
```

→ 每个组件各写一份，改字体要全局替换；Inter 也没有 350 字重，浏览器会伪造字重导致糊。

### PASS：token 化 + 导入收敛 + 合法字重

```css
/* index.css */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Inter:wght@400;500;600&display=swap');

:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-weight-display: 700;
  --font-weight-body: 400;
  --font-weight-body-strong: 600;
}
```

```tsx
<h1 className="font-display font-bold text-5xl">Welcome</h1>
<p className="font-body text-base">...</p>
```

→ 字体、字重都通过 token 收敛；variable font（`opsz,wght`）一次加载覆盖多个字号；字重只用字体实际提供的档位。

## 验证清单

- [ ] 总字体数 ≤ 2（可选 +1 mono），字重档位 ≤ 3 档。
- [ ] 用的是字体真实存在的字重（去 Google Fonts 确认）。
- [ ] Display 只用于 h1-h2，Text 覆盖其他场景。
- [ ] 配对语气与产品定位匹配（见 [industry-design-presets](../industry-design-presets/SKILL.md)）。
- [ ] 导入语句用 `display=swap`，避免首屏不可见文字（FOIT）。
- [ ] 字体 token 已纳入 [design-system-patterns](../design-system-patterns/SKILL.md)。

## 反模式

### FAIL: 4+ 字体 / Display 当正文 / 全字重

```css
body { font-family: 'Playfair Display'; }  /* Display 当正文糊 */
h1 { font-family: 'Bebas'; }
.cta { font-family: 'Montserrat'; }   /* 4+ 字体冲突 */
@import url("...wght@100;200;...;900");  /* 9 档共 200KB+ */
```

### PASS: 1 Display + 1 Text + 必要档位

```css
:root {
  --font-display: 'Fraunces', serif;  /* h1-h2 */
  --font-body: 'Inter', sans-serif;   /* 正文 */
}
@import url("...family=Inter:wght@400;500;600;700&display=swap");
/* 4 档够用 / 或 variable font wght@400..700 */
```

## Catalog 派 vs 反 Reflex 派

B2B / Dashboard / 快速稳妥 → 查 [pairings-catalog.md](references/pairings-catalog.md)。品牌差异化 / 创意 / "不要 AI 味" → 走 [anti-reflex-protocol.md](references/anti-reflex-protocol.md)，该协议会明确拒绝 catalog 里的 Fraunces / Inter / Plus Jakarta Sans 等 20 个反射字体。按场景二选一。

## 参考资料

- [references/pairings-catalog.md](references/pairings-catalog.md) — 45 对稳妥起点
- [references/anti-reflex-protocol.md](references/anti-reflex-protocol.md) — 反 reflex 协议
- [design-system-patterns](../design-system-patterns/SKILL.md)
- [tailwind-design-system](../tailwind-design-system/SKILL.md)
