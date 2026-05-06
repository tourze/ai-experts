## 实施步骤

### 步骤 1：确定主行业 + 氛围词

查 [references/presets-catalog.md](references/presets-catalog.md) 找主行业 preset（如 Fintech）+ 1-2 个氛围词（trust / playful / luxury / technical）。

### 步骤 2：取出 5 要素

每个 preset 给出：**推荐风格 + 主色组 + 字体对 + 关键效果 + 反模式**。

### 步骤 3：接到设计系统

把"主色组"接入 `design-system-patterns` 的 semantic token；字体对接 [font-pairing-library](references/font-pairing-library.md)；风格实现细节查 `modern-web-design`。

## 代码模式

### FAIL：不查行业预设，banking 用 AI 渐变

```tsx
<section className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
  <h1>Modern Banking for the Next Generation</h1>
</section>
```

→ AI 紫粉渐变在 2024-2025 已成"廉价 AI 产品"符号；银行首要情绪是"稳重可托付"，这个渐变直接摧毁信任感。

### PASS：按 Fintech preset 落地

```css
:root {
  --color-brand: #1E3A8A;       /* Deep trust blue */
  --color-accent: #059669;      /* Growth green */
  --color-surface: #F8FAFC;
  --font-display: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

```tsx
<section className="bg-[var(--color-surface)] border-b border-slate-200">
  <h1 className="font-display font-semibold text-slate-900">
    Banking that earns your trust
  </h1>
</section>
```

→ 深蓝 + 增长绿是金融业界长期语义编码；低饱和表面 + 清晰层级 = 信任感；Inter 的几何感传递"现代+专业"。
