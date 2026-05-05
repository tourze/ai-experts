## 适用场景

* 构建或评审 Android UI 代码（Jetpack Compose / XML）
* 实现 Material You / 动态颜色
* 设计导航、布局或组件架构
* 审计无障碍或平台合规性

---

## 1. Material You 与主题 [CRITICAL]

### 1.1 动态颜色

Android 12+ 从用户壁纸提取颜色，应作为默认主题策略。

```kotlin
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> darkColorScheme()
        else -> lightColorScheme()
    }
    MaterialTheme(colorScheme = colorScheme, typography = AppTypography, content = content)
}
```

**规则：**
- **R1.1** — Android 12 以下必须提供静态回退配色方案
- **R1.2** — 禁止在组件中硬编码颜色 hex 值，必须引用主题 color role
- **R1.3** — 至少用 3 张不同壁纸测试动态颜色效果

### 1.2 颜色角色

Material 3 的颜色按语义角色分配，不按美观感觉：

| 角色 | 用途 | 配对前景 |
|------|------|----------|
| `primary` | 主操作、FAB、active 状态 | `onPrimary` |
| `primaryContainer` | 较弱的主色元素 | `onPrimaryContainer` |
| `secondary` | 辅助 UI、Filter Chip | `onSecondary` |
| `secondaryContainer` | 导航栏 active 指示器 | `onSecondaryContainer` |
| `tertiary` | 点缀、对比、补充色 | `onTertiary` |
| `surface` | 背景、卡片、底部弹窗 | `onSurface` |
| `surfaceVariant` | 装饰性元素、分隔线 | `onSurfaceVariant` |
| `error` | 错误状态、破坏性操作 | `onError` |
| `errorContainer` | 错误背景 | `onErrorContainer` |
| `outline` | 边框、分隔线 | — |
| `inverseSurface` | Snackbar 背景 | `inverseOnSurface` |

**规则：**
- **R1.4** — 前景元素必须使用背景对应的 `on` 颜色（如 `primary` 背景 → `onPrimary` 文字）
- **R1.5** — 大面积背景用 `surface` 系列，不用 `primary` / `secondary`
- **R1.6** — `tertiary` 仅用于点缀，不作为主色

### 1.3 明暗主题

- **R1.7** — 必须同时支持 Light 和 Dark 主题，禁止只做 Light
- **R1.8** — Dark 主题使用 elevation 色调映射，不用纯黑 `#000000`；使用 `surface` color role 自动处理
- **R1.9** — 在应用设置中提供手动切换（跟随系统 / 浅色 / 深色）

### 1.4 品牌定制色

- **R1.10** — 通过 Material Theme Builder 从种子色生成色调调色板，禁止手动挑选单个色调
- **R1.11** — 动态颜色作为默认，品牌定制色作为回退

---

## 2. 导航 [CRITICAL]

### 2.1 底部导航栏（Navigation Bar）

手机端 3-5 个顶级目的地的主导航。

- **R2.1** — 仅用于 Compact 屏幕的 3-5 个顶级目的地，不少于 3 个，不多于 5 个
- **R2.2** — 导航项必须显示文字标签，禁止纯图标
- **R2.3** — 选中状态用填充图标，未选中用轮廓图标
- **R2.4** — active 指示器使用 `secondaryContainer` 颜色，不要覆盖

### 2.2 导航栏（Navigation Rail）

平板和折叠屏（Medium / Expanded 屏幕）的侧导航。

- **R2.5** — Medium（600-839dp）和 Expanded（840dp+）屏幕使用 Rail，Compact 屏幕使用底部栏
- **R2.6** — Rail 顶部可放 FAB 作为主操作入口
- **R2.7** — Rail 标签可选但推荐显示

### 2.3 抽屉导航（Navigation Drawer）

5+ 目的地或复杂导航层级。

- **R2.8** — Compact 屏幕用 Modal Drawer，Expanded 屏幕用 Permanent Drawer
- **R2.9** — 抽屉项用分隔线和分区标题分组

### 2.4 预测性返回（Predictive Back）

- **R2.10** — opt-in 预测性返回；Compose 用 `BackHandler`，View 用 `OnBackInvokedCallback`
- **R2.11** — 系统返回 ≠ 导航 Up 按钮，两者路径可能不同
- **R2.12** — 返回时不弹"确定要离开吗？"，除非有未保存的用户输入
- **R2.13** — 禁止压制系统预测性返回动画；自定义转场通过 `BackEventCompat.progress` 插值
- **R2.14** — 优先识别而非回忆：保持目的地标签可见、状态持久化

### 导航组件选择参考

| 屏幕宽度 | 3-5 目的地 | 5+ 目的地 |
|----------|-----------|-----------|
| Compact（< 600dp） | 底部导航栏 | Modal 抽屉 |
| Medium（600-839dp） | Navigation Rail | Rail + Modal 抽屉 |
| Expanded（840dp+） | Navigation Rail | Permanent 抽屉 |

---

## 3. 布局与响应式 [HIGH]

### 3.1 Window Size Class

- **R3.1** — 用 `WindowSizeClass` 做响应式决策
- **R3.2** — 禁止使用固定像素断点
- **R3.3** — 支持全部三个宽度 Size Class

| Size Class | 宽度范围 | 典型设备 |
|------------|---------|----------|
| Compact | < 600dp | 手机竖屏 |
| Medium | 600-839dp | 折叠屏展开、小平板 |
| Expanded | ≥ 840dp | 平板横屏、桌面 |

### 3.2 Material 网格

- **R3.4** — Expanded 屏幕最大内容宽度 ~840dp，避免全宽铺满
- **R3.5** — 按网格规范保持一致的水平边距

| Size Class | 边距 | 间距 | 列数 |
|------------|------|------|------|
| Compact | 16dp | 8dp | 4 |
| Medium | 24dp | 12dp | 8 |
| Expanded | 24dp | 12dp | 12 |

### 3.3 Edge-to-Edge

- **R3.6** — 在 `setContent` 之前调用 `enableEdgeToEdge()`
- **R3.7** — 用 `WindowInsets` 为内容添加系统栏内边距
- **R3.8** — 可滚动内容在透明系统栏后面滚动

```kotlin
// Edge-to-edge 基础配置
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            Scaffold(
                modifier = Modifier.fillMaxSize(),
                contentWindowInsets = WindowInsets(0) // Scaffold 不自动消费 insets
            ) { innerPadding ->
                Content(Modifier.padding(innerPadding))
            }
        }
    }
}
```

### 3.4 折叠屏支持

- **R3.9** — 检测折叠铰链位置，避免内容跨越折叠线
- **R3.10** — 使用 `ListDetailPaneScaffold` 实现折叠屏感知的列表-详情布局

---

## 4-10. 排版、组件、无障碍、手势、通知、权限、系统集成

完整规则详见 [references/rules-4-to-10.md](references/rules-4-to-10.md)，包含：
- 排版：Material 字体比例、sp 单位、200% 缩放测试（R4.1-R4.5）
- 组件：FAB / Top App Bar / Bottom Sheet / Dialog / Snackbar / Chip（R5.1-R5.19）
- 无障碍：contentDescription / 触摸目标 ≥ 48dp / 对比度 / TalkBack（R6.1-R6.13）
- 手势：系统手势区域 / 涟漪 / 长按（R7.1-R7.7）
- 通知：Channel / MessagingStyle / 前台服务（R8.1-R8.9）
- 权限：按需请求 / Photo Picker / 定位降级（R9.1-R9.8）
- 系统集成：Widget Glance API / App Links / 快捷方式（R10.1-R10.10）
- 交叉引用表

## 反模式

### FAIL: 硬编码颜色

```kotlin
Text("Hello", color = Color(0xFF3B82F6))
// 忽略动态颜色 → 暗色模式不可读 / 与壁纸冲突
```

### PASS: 引用 color role

```kotlin
Text("Hello", color = MaterialTheme.colorScheme.primary)
// 动态颜色自动适配 / 暗色模式自动切换
```

### FAIL: 底部导航 → 平板

```kotlin
// 在 Expanded 屏幕（840dp+）仍用底部导航栏
NavigationBar { ... }
// 浪费宝贵垂直空间 / HIG 要求平板用 Rail
```

### PASS: WindowSizeClass 适配

```kotlin
when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> NavigationBar { ... }
    else -> NavigationRail { ... }
}
```

### FAIL: 启动批量请求权限

```kotlin
// onCreate 里一次性弹 5 个权限
requestPermissions(arrayOf(CAMERA, LOCATION, CONTACTS, PHONE, STORAGE))
// 用户被吓到 → 全部拒绝
```

### PASS: 按功能延迟请求

```kotlin
// 用户点"拍照"时
if (!hasCameraPermission) {
    showRationale("需要相机权限来扫描发票")
    requestPermission(CAMERA)
}
// 上下文清楚 → 授权率高
```
