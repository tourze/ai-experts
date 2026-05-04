# 色彩系统参考

## 色板生成

### 感知均匀色阶（OKLCH）

```css
:root {
  --blue-50: oklch(97% 0.02 250);
  --blue-100: oklch(93% 0.04 250);
  --blue-200: oklch(86% 0.08 250);
  --blue-300: oklch(75% 0.12 250);
  --blue-400: oklch(65% 0.16 250);
  --blue-500: oklch(55% 0.2 250); /* 主色 */
  --blue-600: oklch(48% 0.18 250);
  --blue-700: oklch(40% 0.16 250);
  --blue-800: oklch(32% 0.12 250);
  --blue-900: oklch(25% 0.08 250);
  --blue-950: oklch(18% 0.05 250);
}
```

### 程序化色阶

```tsx
function generateColorScale(hue: number, saturation = 100) {
  const stops = [
    { n: "50", l: 97 }, { n: "100", l: 93 }, { n: "200", l: 85 },
    { n: "300", l: 75 }, { n: "400", l: 65 }, { n: "500", l: 55 },
    { n: "600", l: 45 }, { n: "700", l: 35 }, { n: "800", l: 25 },
    { n: "900", l: 18 }, { n: "950", l: 12 },
  ];
  return Object.fromEntries(stops.map(({ n, l }) => [n, `hsl(${hue}, ${saturation}%, ${l}%)`]));
}
const brand = generateColorScale(220); // 蓝
const success = generateColorScale(142); // 绿
```

## 语义色 Token（两层体系）

```css
/* 第一层：原始色值 */
:root {
  --primitive-blue-500: #3b82f6; --primitive-blue-600: #2563eb;
  --primitive-green-500: #22c55e; --primitive-red-500: #ef4444;
  --primitive-gray-50: #f9fafb; --primitive-gray-900: #111827;
}
/* 第二层：语义 Token */
:root {
  --color-bg-primary: var(--primitive-gray-50);
  --color-bg-secondary: white;
  --color-bg-inverse: var(--primitive-gray-900);
  --color-text-primary: var(--primitive-gray-900);
  --color-text-secondary: var(--primitive-gray-600);
  --color-text-link: var(--primitive-blue-600);
  --color-border-default: var(--primitive-gray-200);
  --color-border-focus: var(--primitive-blue-500);
  --color-interactive-primary: var(--primitive-blue-600);
  --color-interactive-primary-hover: var(--primitive-blue-700);
  --color-status-success: var(--primitive-green-500);
  --color-status-error: var(--primitive-red-500);
}
/* 第三层：组件 Token */
:root {
  --button-bg: var(--color-interactive-primary);
  --button-text: white;
  --input-bg: var(--color-bg-secondary);
  --input-border: var(--color-border-default);
  --input-border-focus: var(--color-border-focus);
  --card-bg: var(--color-bg-secondary);
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

## 深色模式

```css
:root {
  --color-bg-primary: #ffffff; --color-text-primary: #111827;
  --color-bg-secondary: #f9fafb; --color-border-default: #e5e7eb;
}
[data-theme="dark"] {
  --color-bg-primary: #111827; --color-text-primary: #f9fafb;
  --color-bg-secondary: #1f2937; --color-border-default: #374151;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg-primary: #111827; --color-text-primary: #f9fafb;
  }
}
```

### React 主题上下文

```tsx
type Theme = "light" | "dark" | "system";
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    root.setAttribute("data-theme", resolved);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```

## 对比度与可访问性

```tsx
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) throw new Error("无效十六进制颜色");
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(h1: string, h2: string): number {
  const l1 = getLuminance(...hexToRgb(h1)), l2 = getLuminance(...hexToRgb(h2));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function meetsWCAG(fg: string, bg: string, size: "normal" | "large" = "normal", level: "AA" | "AAA" = "AA"): boolean {
  const req = { normal: { AA: 4.5, AAA: 7 }, large: { AA: 3, AAA: 4.5 } };
  return getContrastRatio(fg, bg) >= req[size][level];
}

// 为任意背景色生成可访问文本色
function getAccessibleTextColor(bg: string): string {
  return getLuminance(...hexToRgb(bg)) > 0.179 ? "#111827" : "#ffffff";
}
```

## 色彩调和

```tsx
type HarmonyType = "complementary" | "triadic" | "analogous" | "split-complementary";

function generateHarmony(baseHue: number, type: HarmonyType): number[] {
  switch (type) {
    case "complementary": return [baseHue, (baseHue + 180) % 360];
    case "triadic": return [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
    case "analogous": return [(baseHue - 30 + 360) % 360, baseHue, (baseHue + 30) % 360];
    case "split-complementary": return [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
  }
}
```

## 色盲无障碍

色盲可访问性最佳实践：不单靠颜色传达信息；配合图案或图标；确保颜色间有足够对比度；使用蓝-橙替代红-绿获取对比度。测试工具：Chrome DevTools Rendering 面板 → Emulate vision deficiencies。

## CSS 颜色函数

```css
.modern-colors {
  --lighter: hsl(from var(--base) h s calc(l + 20%));
  --darker: hsl(from var(--base) h s calc(l - 20%));
  --mixed: color-mix(in srgb, var(--c1), var(--c2) 30%);
  --semi: rgb(from var(--base) r g b / 50%);
  --vibrant: oklch(60% 0.2 250);
}
.alpha-scale {
  --color-10: rgb(59 130 246 / 0.1);
  --color-20: rgb(59 130 246 / 0.2);
  --color-50: rgb(59 130 246 / 0.5);
}
```
