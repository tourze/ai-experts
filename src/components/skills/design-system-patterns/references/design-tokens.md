# 设计 Token 深入探讨

## 概述

设计 token 是设计系统的原子值——定义视觉风格的最小部件。它们通过为颜色、字体、间距和其他设计决策提供单一事实来源，弥合设计与开发之间的差距。

## Token 类别

### 颜色 Token

```json
{
  "color": {
    "primitive": {
      "gray": {
        "0": { "value": "#ffffff" },
        "50": { "value": "#fafafa" },
        "100": { "value": "#f5f5f5" },
        "200": { "value": "#e5e5e5" },
        "300": { "value": "#d4d4d4" },
        "400": { "value": "#a3a3a3" },
        "500": { "value": "#737373" },
        "600": { "value": "#525252" },
        "700": { "value": "#404040" },
        "800": { "value": "#262626" },
        "900": { "value": "#171717" },
        "950": { "value": "#0a0a0a" }
      },
      "blue": {
        "50": { "value": "#eff6ff" },
        "100": { "value": "#dbeafe" },
        "200": { "value": "#bfdbfe" },
        "300": { "value": "#93c5fd" },
        "400": { "value": "#60a5fa" },
        "500": { "value": "#3b82f6" },
        "600": { "value": "#2563eb" },
        "700": { "value": "#1d4ed8" },
        "800": { "value": "#1e40af" },
        "900": { "value": "#1e3a8a" }
      },
      "red": {
        "500": { "value": "#ef4444" },
        "600": { "value": "#dc2626" }
      },
      "green": {
        "500": { "value": "#22c55e" },
        "600": { "value": "#16a34a" }
      },
      "amber": {
        "500": { "value": "#f59e0b" },
        "600": { "value": "#d97706" }
      }
    }
  }
}
```

### 字体 Token

```json
{
  "typography": {
    "fontFamily": {
      "sans": { "value": "Inter, system-ui, sans-serif" },
      "mono": { "value": "JetBrains Mono, Menlo, monospace" }
    },
    "fontSize": {
      "xs": { "value": "0.75rem" },
      "sm": { "value": "0.875rem" },
      "base": { "value": "1rem" },
      "lg": { "value": "1.125rem" },
      "xl": { "value": "1.25rem" },
      "2xl": { "value": "1.5rem" },
      "3xl": { "value": "1.875rem" },
      "4xl": { "value": "2.25rem" }
    },
    "fontWeight": {
      "normal": { "value": "400" },
      "medium": { "value": "500" },
      "semibold": { "value": "600" },
      "bold": { "value": "700" }
    },
    "lineHeight": {
      "tight": { "value": "1.25" },
      "normal": { "value": "1.5" },
      "relaxed": { "value": "1.75" }
    },
    "letterSpacing": {
      "tight": { "value": "-0.025em" },
      "normal": { "value": "0" },
      "wide": { "value": "0.025em" }
    }
  }
}
```

### 间距 Token

```json
{
  "spacing": {
    "0": { "value": "0" },
    "0.5": { "value": "0.125rem" },
    "1": { "value": "0.25rem" },
    "1.5": { "value": "0.375rem" },
    "2": { "value": "0.5rem" },
    "2.5": { "value": "0.625rem" },
    "3": { "value": "0.75rem" },
    "3.5": { "value": "0.875rem" },
    "4": { "value": "1rem" },
    "5": { "value": "1.25rem" },
    "6": { "value": "1.5rem" },
    "7": { "value": "1.75rem" },
    "8": { "value": "2rem" },
    "9": { "value": "2.25rem" },
    "10": { "value": "2.5rem" },
    "12": { "value": "3rem" },
    "14": { "value": "3.5rem" },
    "16": { "value": "4rem" },
    "20": { "value": "5rem" },
    "24": { "value": "6rem" }
  }
}
```

### 效果 Token

```json
{
  "shadow": {
    "sm": { "value": "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
    "md": {
      "value": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    },
    "lg": {
      "value": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
    },
    "xl": {
      "value": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
    }
  },
  "radius": {
    "none": { "value": "0" },
    "sm": { "value": "0.125rem" },
    "md": { "value": "0.375rem" },
    "lg": { "value": "0.5rem" },
    "xl": { "value": "0.75rem" },
    "2xl": { "value": "1rem" },
    "full": { "value": "9999px" }
  },
  "opacity": {
    "0": { "value": "0" },
    "25": { "value": "0.25" },
    "50": { "value": "0.5" },
    "75": { "value": "0.75" },
    "100": { "value": "1" }
  }
}
```

## 语义 Token 映射

### 亮色主题

```json
{
  "semantic": {
    "light": {
      "background": {
        "default": { "value": "{color.primitive.gray.0}" },
        "subtle": { "value": "{color.primitive.gray.50}" },
        "muted": { "value": "{color.primitive.gray.100}" },
        "emphasis": { "value": "{color.primitive.gray.900}" }
      },
      "foreground": {
        "default": { "value": "{color.primitive.gray.900}" },
        "muted": { "value": "{color.primitive.gray.600}" },
        "subtle": { "value": "{color.primitive.gray.400}" },
        "onEmphasis": { "value": "{color.primitive.gray.0}" }
      },
      "border": {
        "default": { "value": "{color.primitive.gray.200}" },
        "muted": { "value": "{color.primitive.gray.100}" },
        "emphasis": { "value": "{color.primitive.gray.900}" }
      },
      "accent": {
        "default": { "value": "{color.primitive.blue.500}" },
        "emphasis": { "value": "{color.primitive.blue.600}" },
        "muted": { "value": "{color.primitive.blue.100}" },
        "subtle": { "value": "{color.primitive.blue.50}" }
      },
      "success": {
        "default": { "value": "{color.primitive.green.500}" },
        "emphasis": { "value": "{color.primitive.green.600}" }
      },
      "warning": {
        "default": { "value": "{color.primitive.amber.500}" },
        "emphasis": { "value": "{color.primitive.amber.600}" }
      },
      "danger": {
        "default": { "value": "{color.primitive.red.500}" },
        "emphasis": { "value": "{color.primitive.red.600}" }
      }
    }
  }
}
```

### 暗色主题

```json
{
  "semantic": {
    "dark": {
      "background": {
        "default": { "value": "{color.primitive.gray.950}" },
        "subtle": { "value": "{color.primitive.gray.900}" },
        "muted": { "value": "{color.primitive.gray.800}" },
        "emphasis": { "value": "{color.primitive.gray.50}" }
      },
      "foreground": {
        "default": { "value": "{color.primitive.gray.50}" },
        "muted": { "value": "{color.primitive.gray.400}" },
        "subtle": { "value": "{color.primitive.gray.500}" },
        "onEmphasis": { "value": "{color.primitive.gray.950}" }
      },
      "border": {
        "default": { "value": "{color.primitive.gray.800}" },
        "muted": { "value": "{color.primitive.gray.900}" },
        "emphasis": { "value": "{color.primitive.gray.50}" }
      },
      "accent": {
        "default": { "value": "{color.primitive.blue.400}" },
        "emphasis": { "value": "{color.primitive.blue.300}" },
        "muted": { "value": "{color.primitive.blue.900}" },
        "subtle": { "value": "{color.primitive.blue.950}" }
      }
    }
  }
}
```

## Token 命名约定

### 推荐结构

```
[类别]-[属性]-[变体]-[状态]

示例：
- color-background-default
- color-text-primary
- color-border-input-focus
- spacing-component-padding
- typography-heading-lg
```

### 命名指南

1. **使用小写连字符**：`text-primary` 而非 `textPrimary`
2. **描述性**：`button-padding-horizontal` 而非 `btn-px`
3. **使用语义名称**：`danger` 而非 `red`
4. **包含规模信息**：`spacing-4` 或 `font-size-lg`
5. **状态后缀**：`-hover`、`-focus`、`-active`、`-disabled`

## CSS 自定义属性输出

```css
:root {
  /* 原始值 */
  --color-gray-50: #fafafa;
  --color-gray-100: #f5f5f5;
  --color-gray-900: #171717;
  --color-blue-500: #3b82f6;

  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;

  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  /* 语义 - 亮色主题 */
  --background-default: var(--color-white);
  --background-subtle: var(--color-gray-50);
  --foreground-default: var(--color-gray-900);
  --foreground-muted: var(--color-gray-600);
  --border-default: var(--color-gray-200);
  --accent-default: var(--color-blue-500);
}

.dark {
  /* 语义 - 暗色主题覆盖 */
  --background-default: var(--color-gray-950);
  --background-subtle: var(--color-gray-900);
  --foreground-default: var(--color-gray-50);
  --foreground-muted: var(--color-gray-400);
  --border-default: var(--color-gray-800);
  --accent-default: var(--color-blue-400);
}
```

## Token 转换

### Style Dictionary 转换

```javascript
const StyleDictionary = require("style-dictionary");

// 自定义 px 转 rem 转换
StyleDictionary.registerTransform({
  name: "size/pxToRem",
  type: "value",
  matcher: (token) => token.attributes.category === "size",
  transformer: (token) => {
    const value = parseFloat(token.value);
    return `${value / 16}rem`;
  },
});

// 自定义 CSS 自定义属性格式
StyleDictionary.registerFormat({
  name: "css/customProperties",
  formatter: function ({ dictionary, options }) {
    const tokens = dictionary.allTokens.map((token) => {
      const name = token.name.replace(/\./g, "-");
      return `  --${name}: ${token.value};`;
    });

    return `:root {\n${tokens.join("\n")}\n}`;
  },
});
```

### 平台特定输出

```javascript
// iOS Swift 输出
public enum DesignTokens {
    public enum Color {
        public static let gray50 = UIColor(hex: "#fafafa")
        public static let gray900 = UIColor(hex: "#171717")
        public static let blue500 = UIColor(hex: "#3b82f6")
    }

    public enum Spacing {
        public static let space1: CGFloat = 4
        public static let space2: CGFloat = 8
        public static let space4: CGFloat = 16
    }
}

// Android XML 输出
<resources>
    <color name="gray_50">#fafafa</color>
    <color name="gray_900">#171717</color>
    <color name="blue_500">#3b82f6</color>

    <dimen name="spacing_1">4dp</dimen>
    <dimen name="spacing_2">8dp</dimen>
    <dimen name="spacing_4">16dp</dimen>
</resources>
```

## Token 治理

### 变更管理

1. **提议**：记录变更内容和理由
2. **评审**：设计和工程评审
3. **测试**：在所有平台上验证
4. **沟通**：向消费者宣布变更
5. **弃用**：标记旧 token，提供迁移路径
6. **移除**：在弃用期之后

### 弃用模式

```json
{
  "color": {
    "primary": {
      "value": "{color.primitive.blue.500}",
      "deprecated": true,
      "deprecatedMessage": "请改用 accent.default",
      "replacedBy": "semantic.accent.default"
    }
  }
}
```

## Token 验证

```typescript
interface TokenValidation {
  checkContrastRatios(): ContrastReport;
  validateReferences(): ReferenceReport;
  detectCircularDeps(): CircularDepReport;
  auditNaming(): NamingReport;
}

// 对比度验证
function validateContrast(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === "AA" ? ratio >= 4.5 : ratio >= 7;
}
```

## 资源

- [Design Tokens W3C Community Group](https://design-tokens.github.io/community-group/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Tokens Studio](https://tokens.studio/)
- [Open Props](https://open-props.style/)
