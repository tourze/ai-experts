---
title: React Compiler
impact: HIGH
tags: memoization, react-compiler, memo, useMemo, useCallback
---

# 技能：React Compiler

设置 React Compiler 以自动对组件进行 memoization 并消除不必要的重新渲染。

## 快速模式

**之前（手动 memoization）：**

```jsx
const MemoizedButton = memo(({ onPress }) => <Pressable onPress={onPress} />);
const handler = useCallback(() => doSomething(), []);
```

**之后（使用 React Compiler 自动处理）：**

```jsx
// 无需 memo/useCallback —— 编译器处理
const Button = ({ onPress }) => <Pressable onPress={onPress} />;
const handler = () => doSomething();
```

## 适用场景

- 希望自动优化性能，无需手动 `memo`/`useMemo`/`useCallback`
- 代码库遵循 React 规则
- React Native 0.76+ 或 Expo SDK 52+
- 准备移除模板化的 memoization 代码

## 前置条件

- React 17+（推荐 React 19 以获得最佳兼容性）
- 基于 Babel 的构建系统
- 代码遵循 [React 规则](https://react.dev/reference/rules)

## 分步说明

### 步骤 1：检查兼容性

在启用编译器之前，验证你的项目是否兼容：

```bash
npx react-compiler-healthcheck@latest
```

这检查你的应用是否遵循 React 规则并识别潜在问题。

### 步骤 2：安装 React Compiler

#### Expo 项目

**SDK 54 及更新版本**（简化的设置）：

```bash
npx expo install babel-plugin-react-compiler
```

**SDK 52-53**：

```bash
npx expo install babel-plugin-react-compiler@beta react-compiler-runtime@beta
```

然后在应用配置中启用：

```json
// app.json
{
  "expo": {
    "experiments": {
      "reactCompiler": true
    }
  }
}
```

#### React Native（无 Expo）

```bash
npm install -D babel-plugin-react-compiler@latest
```

对于 React Native < 0.78（React < 19），同时安装 runtime：

```bash
npm install react-compiler-runtime@beta
```

### 步骤 3：配置 Babel（非 Expo 的 React Native）

对于非 Expo 的 React Native 项目，手动配置 Babel：

```javascript
// babel.config.js
const ReactCompilerConfig = {
  target: '19', // React Native < 0.78 使用 '18'
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      ['babel-plugin-react-compiler', ReactCompilerConfig], // 必须首先运行！
      // ... 其他插件
    ],
  };
};
```

> **重要**：React Compiler 必须在 Babel 插件流水线中**首先**运行。编译器需要原始源代码信息以进行正确分析。

### 步骤 4：设置 ESLint（推荐）

ESLint 插件帮助识别无法优化的代码并强制执行 React 规则。

#### Expo 项目

```bash
npx expo lint  # 确保 ESLint 已设置
npx expo install eslint-plugin-react-compiler -- -D
```

配置 ESLint：

```javascript
// .eslintrc.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactCompiler = require('eslint-plugin-react-compiler');

module.exports = defineConfig([
  expoConfig,
  reactCompiler.configs.recommended,
  {
    ignores: ['dist/*'],
  },
]);
```

#### React Native（无 Expo）

```bash
npm install -D eslint-plugin-react-hooks@latest
```

编译器规则包含在 `recommended-latest` 预设中。请遵循 [eslint-plugin-react-hooks 安装说明](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)。

### 步骤 5：验证优化

打开 React DevTools。优化后的组件会显示 `Memo ✨` 徽章。

你也可以通过检查构建输出来验证 —— 编译后的代码包括自动 memoization：

```javascript
import { c as _c } from 'react/compiler-runtime';

export default function MyApp() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for('react.memo_cache_sentinel')) {
    t0 = <div>Hello World</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
```

**注意**：React Native 0.76+ 默认包含带 Memo 徽章支持的 DevTools。对于旧版本或版本不匹配的第三方调试器，你可能需要在 `package.json` 中覆盖 `react-devtools-core`。

## 增量采用

你可以使用两种策略增量采用 React Compiler：

### 策略 1：限制到特定目录

配置 Babel 插件仅对特定文件运行，例如以下示例中的 `src/path/to/dir`：

**Expo**（使用 `npx expo customize babel.config.js` 创建 `babel.config.js`）：

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          'react-compiler': {
            sources: (filename) => {
              return filename.includes('src/path/to/dir');
            },
          },
        },
      ],
    ],
  };
};
```

**React Native（无 Expo）**：

```javascript
// babel.config.js
const ReactCompilerConfig = {
  target: '19',
  sources: (filename) => {
    return filename.includes('src/path/to/dir');
  },
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
  };
};
```

更改 `babel.config.js` 后，清除缓存重新启动 Metro：

```bash
# Expo
npx expo start --clear

# React Native CLI
npx react-native start --reset-cache
```

### 策略 2：选择退出特定组件

使用 `"use no memo"` 指令跳过特定组件或文件的优化：

```jsx
function ProblematicComponent() {
  'use no memo';

  return <Text>Will not be optimized</Text>;
}
```

这对于临时退出导致问题的组件很有用。修复底层问题后移除该指令。

## 工作原理

编译器转换你的代码以自动缓存值：

**之前（你的代码）：**

```jsx
export default function MyApp() {
  const [value, setValue] = useState('');
  return (
    <TextInput onChangeText={() => setValue(value)}>Hello World</TextInput>
  );
}
```

**之后（编译后的输出）：**

```jsx
import { c as _c } from 'react/compiler-runtime';

export default function MyApp() {
  const $ = _c(2); // 2 个槽位的缓存
  const [value, setValue] = useState('');

  let t0;
  if ($[0] !== value) {
    t0 = (
      <TextInput onChangeText={() => setValue(value)}>Hello World</TextInput>
    );
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1]; // 返回缓存的 JSX
  }
  return t0;
}
```

## 代码示例

### React Compiler 游乐场

在 [React Playground](https://playground.react.dev/) 测试转换。

### 哪些会被优化

```jsx
// 组件 —— 自动 memoize
const Button = ({ onPress, label }) => (
  <Pressable onPress={onPress}>
    <Text>{label}</Text>
  </Pressable>
);

// 回调 —— 自动缓存（无需 useCallback）
const handlePress = () => {
  console.log('pressed');
};

// 昂贵计算 —— 自动缓存（无需 useMemo）
const filtered = items.filter((item) => item.active);
```

### 哪些会破坏编译

```jsx
// 错误：修改 props
const BadComponent = ({ items }) => {
  items.push('new item'); // 修改！
  return <List data={items} />;
};

// 错误：渲染期间修改
const BadMutation = () => {
  const [items, setItems] = useState([]);
  items.push('new'); // 渲染期间修改！
  return <List data={items} />;
};

// 错误：非幂等渲染
let counter = 0;
const BadRender = () => {
  counter++; // 渲染期间的副作用！
  return <Text>{counter}</Text>;
};
```

## 应该移除手动 Memoization 吗？

改进主要是自动的。一旦编译器在你的项目中正常运行，可以移除 `useCallback`、`useMemo` 和 `React.memo` 的实例，转而使用自动 memoization。

**注意**：类组件不会被优化。迁移到函数组件以获得全部好处。

Expo 的实现仅在应用代码上运行（不在 node_modules 中），且仅在捆绑到客户端时运行（服务端渲染时禁用）。

## 预期性能改进

在 Expensify 应用上的测试显示：

- **Chat Finder TTI 改善 4.3%**
- 级联重新渲染显著减少
- 对没有现有手动优化的应用影响最大

已重度优化的应用可能收益有限。

## 常见陷阱

- **未先修复 ESLint 错误**：ESLint 报告错误时，编译器会跳过该组件 —— 这是安全的，但意味着你错过了优化
- **期望它能修复不良模式**：编译器优化好的代码，不修复坏的代码
- **忘记浅比较**：与 `memo` 一样，编译器对对象/数组使用浅比较
- **未运行健康检查**：在启用前始终运行 `npx react-compiler-healthcheck@latest`

## 相关技能

- [js-profile-react.md](./js-profile-react.md) —— 验证优化影响
- [js-atomic-state.md](./js-atomic-state.md) —— 状态相关重新渲染的替代方案
