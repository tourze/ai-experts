# 主题架构

## 概述

一个健壮的主题系统使应用程序能够支持多种视觉外观（亮色/暗色模式、品牌主题），同时保持一致性和开发者体验。

## CSS 自定义属性架构

### 基础设置

```css
/* 1. 定义 token 契约 */
:root {
  /* 配色方案 */
  color-scheme: light dark;

  /* 不随主题变化的基础 token */
  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* 动画 token */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index 层级 */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
}

/* 2. 亮色主题（默认） */
:root,
[data-theme="light"] {
  --color-bg: #ffffff;
  --color-bg-subtle: #f8fafc;
  --color-bg-muted: #f1f5f9;
  --color-bg-emphasis: #0f172a;

  --color-text: #0f172a;
  --color-text-muted: #475569;
  --color-text-subtle: #94a3b8;

  --color-border: #e2e8f0;
  --color-border-muted: #f1f5f9;

  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-accent-muted: #dbeafe;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* 3. 暗色主题 */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-bg-subtle: #1e293b;
  --color-bg-muted: #334155;
  --color-bg-emphasis: #f8fafc;

  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-text-subtle: #64748b;

  --color-border: #334155;
  --color-border-muted: #1e293b;

  --color-accent: #60a5fa;
  --color-accent-hover: #93c5fd;
  --color-accent-muted: #1e3a5f;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}

/* 4. 系统偏好检测 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* 继承暗色主题值 */
    --color-bg: #0f172a;
    /* ... 其他暗色值 */
  }
}
```

### 在组件中使用 Token

```css
.card {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}

.card-title {
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 1.125rem;
  font-weight: 600;
}

.card-description {
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}

.button-primary {
  background: var(--color-accent);
  color: white;
  transition: background var(--duration-fast) var(--ease-default);
}

.button-primary:hover {
  background: var(--color-accent-hover);
}
```

## React 主题提供器

### 完整实现

```tsx
// theme-provider.tsx
import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: "class" | "data-theme";
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeProviderState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>("light");

  // 获取系统偏好
  const getSystemTheme = React.useCallback((): ResolvedTheme => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // 应用主题到 DOM
  const applyTheme = React.useCallback(
    (newTheme: ResolvedTheme) => {
      const root = document.documentElement;

      // 临时禁用过渡
      if (disableTransitionOnChange) {
        const css = document.createElement("style");
        css.appendChild(
          document.createTextNode(
            `*,*::before,*::after{transition:none!important}`,
          ),
        );
        document.head.appendChild(css);

        // 强制重绘
        (() => window.getComputedStyle(document.body))();

        // 一个 tick 后移除
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      }

      // 应用属性
      if (attribute === "class") {
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      } else {
        root.setAttribute(attribute, newTheme);
      }

      // 更新原生元素的 color-scheme
      root.style.colorScheme = newTheme;

      setResolvedTheme(newTheme);
    },
    [attribute, disableTransitionOnChange],
  );

  // 处理主题变更
  React.useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
  }, [theme, applyTheme, getSystemTheme]);

  // 监听系统主题变化
  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme(getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, enableSystem, applyTheme, getSystemTheme]);

  // 持久化到 localStorage
  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey],
  );

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

### 主题切换组件

```tsx
// theme-toggle.tsx
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <button
        onClick={() => setTheme("light")}
        className={`rounded-md p-2 ${
          theme === "light" ? "bg-background shadow-sm" : ""
        }`}
        aria-label="亮色主题"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-md p-2 ${
          theme === "dark" ? "bg-background shadow-sm" : ""
        }`}
        aria-label="暗色主题"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`rounded-md p-2 ${
          theme === "system" ? "bg-background shadow-sm" : ""
        }`}
        aria-label="系统主题"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
```

## 多品牌主题

### 品牌 Token 结构

```css
/* 品牌 A - 企业蓝 */
[data-brand="corporate"] {
  --brand-primary: #0066cc;
  --brand-primary-hover: #0052a3;
  --brand-secondary: #f0f7ff;
  --brand-accent: #00a3e0;

  --brand-font-heading: "Helvetica Neue", sans-serif;
  --brand-font-body: "Open Sans", sans-serif;

  --brand-radius: 0.25rem;
  --brand-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 品牌 B - 现代初创 */
[data-brand="startup"] {
  --brand-primary: #7c3aed;
  --brand-primary-hover: #6d28d9;
  --brand-secondary: #faf5ff;
  --brand-accent: #f472b6;

  --brand-font-heading: "Poppins", sans-serif;
  --brand-font-body: "Inter", sans-serif;

  --brand-radius: 1rem;
  --brand-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

/* 品牌 C - 极简 */
[data-brand="minimal"] {
  --brand-primary: #171717;
  --brand-primary-hover: #404040;
  --brand-secondary: #fafafa;
  --brand-accent: #171717;

  --brand-font-heading: "Space Grotesk", sans-serif;
  --brand-font-body: "IBM Plex Sans", sans-serif;

  --brand-radius: 0;
  --brand-shadow: none;
}
```

## 无障碍考量

### 减少动效

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 高对比度模式

```css
@media (prefers-contrast: high) {
  :root {
    --color-text: #000000;
    --color-text-muted: #000000;
    --color-bg: #ffffff;
    --color-border: #000000;
    --color-accent: #0000ee;
  }

  [data-theme="dark"] {
    --color-text: #ffffff;
    --color-text-muted: #ffffff;
    --color-bg: #000000;
    --color-border: #ffffff;
    --color-accent: #ffff00;
  }
}
```

### 强制颜色

```css
@media (forced-colors: active) {
  .button {
    border: 2px solid currentColor;
  }

  .card {
    border: 1px solid CanvasText;
  }

  .link {
    text-decoration: underline;
  }
}
```

## 服务端渲染

### 防止未样式内容的闪烁

```tsx
// 内联脚本以防止 FOUC
const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  })();
`;

// 在 Next.js layout 中 - 注意：生产环境中内联脚本应适当清理
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          // 仅用于可信的静态内容
          // 对于动态内容，使用清理库
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

## 测试主题

```tsx
// theme.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./theme-provider";

function TestComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>设置为暗色</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("应默认为系统主题", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("应切换到暗色主题", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("设置为暗色"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
```

## 资源

- [Web.dev: prefers-color-scheme](https://web.dev/prefers-color-scheme/)
- [CSS Color Scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Radix UI Colors](https://www.radix-ui.com/colors)
