---
name: android-design-guidelines
description: Material Design 3 与 Android 平台设计规范，106 条规则覆盖 Material You、动态颜色、导航、Compose 组件、无障碍、自适应布局和 Android 特有交互。
---

# Android 平台设计规范 — Material Design 3

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

## 4. 排版 [HIGH]

### Material 字体比例

| 角色 | 默认大小 | 用途 |
|------|---------|------|
| displayLarge | 57sp | 超大标题 |
| displayMedium | 45sp | 大标题 |
| displaySmall | 36sp | 标题 |
| headlineLarge | 32sp | 页面标题 |
| headlineMedium | 28sp | 区域标题 |
| headlineSmall | 24sp | 子标题 |
| titleLarge | 22sp | 顶栏标题 |
| titleMedium | 16sp | 列表项标题 |
| titleSmall | 14sp | 辅助标题 |
| bodyLarge | 16sp | 正文（主要） |
| bodyMedium | 14sp | 正文（次要） |
| bodySmall | 12sp | 辅助文字 |
| labelLarge | 14sp | 按钮文字 |
| labelMedium | 12sp | 标签、Badge |
| labelSmall | 11sp | 时间戳、角标 |

**规则：**
- **R4.1** — 所有文字尺寸使用 `sp` 单位（不用 `dp`），以支持用户字体缩放
- **R4.2** — 正文最小 12sp，标签最小 11sp
- **R4.3** — 引用 `MaterialTheme.typography` 角色，不硬编码尺寸
- **R4.4** — 在 200% 字体缩放下测试，确认无裁切
- **R4.5** — 行高为字号的 1.2-1.5 倍

---

## 5. 组件 [HIGH]

### 5.1 FAB（浮动操作按钮）

- **R5.1** — 每个屏幕最多一个 FAB
- **R5.2** — FAB 定位在右下角，位于底部导航栏之上
- **R5.3** — FAB 默认使用 `primaryContainer` 颜色
- **R5.4** — 优先使用带文字标签的 `ExtendedFloatingActionButton`

### 5.2 顶栏（Top App Bar）

- **R5.5** — 大多数页面用 Small Top App Bar；突出标题时用 Medium / Large
- **R5.6** — 顶栏与滚动行为联动（`TopAppBarScrollBehavior`）
- **R5.7** — 操作图标限制 2-3 个，其余收入溢出菜单

### 5.3 底部弹窗（Bottom Sheet）

- **R5.8** — Modal 用于补充内容，Standard 用于持久面板
- **R5.9** — 底部弹窗必须有可见拖拽手柄
- **R5.10** — 弹窗内容溢出时必须可滚动

### 5.4 对话框（Dialog）

- **R5.11** — 仅用于关键决策，非关键信息用 Snackbar 或 Bottom Sheet
- **R5.12** — 确认按钮为文本按钮；取消按钮在左侧
- **R5.13** — 标题用简洁的问句或陈述句

### 5.5 Snackbar

- **R5.14** — 用于简短的非关键反馈
- **R5.15** — Snackbar 位于底部导航栏之上、FAB 之下
- **R5.16** — 可撤销操作附带 undo 按钮

### 5.6 Chip

- **R5.17** — 按场景选择正确的 Chip 类型：Filter / Assist / Input / Suggestion
- **R5.18** — Chip 水平滚动或流式布局排列，不垂直堆叠

### 5.7 等待状态

- **R5.19** — 立即展示等待状态；长时间操作提供可见进度指示

### 组件选择参考

| 需求 | 推荐组件 |
|------|----------|
| 页面主操作 | FAB / ExtendedFAB |
| 页面标题 + 操作 | Top App Bar |
| 补充操作面板 | Bottom Sheet |
| 关键确认 | AlertDialog |
| 简短反馈 | Snackbar |
| 过滤/选择标签 | FilterChip |
| 辅助建议 | AssistChip / SuggestionChip |

---

## 6. 无障碍 [CRITICAL]

> 详细审计流程和代码示例参见 `android-accessibility` skill。

- **R6.1** — 每个可交互元素必须有 `contentDescription`
- **R6.2** — 描述动作/含义，不描述视觉外观
- **R6.3** — 关联元素用 `mergeDescendants` 合并播报
- **R6.4** — 仅手势/长按触发的操作必须提供 `customActions`
- **R6.5** — 触摸目标最小 48×48dp
- **R6.6** — 不以缩小触摸目标换取更紧凑的布局
- **R6.7** — 文字对比度 ≥ 4.5:1（普通），≥ 3:1（大文本）
- **R6.8** — 禁止仅靠颜色传递信息
- **R6.9** — 支持系统粗体文本和高对比度设置
- **R6.10** — 焦点顺序遵循从上到下、从 Start 到 End 的逻辑
- **R6.11** — 导航/Dialog 关闭后焦点移至逻辑目标
- **R6.12** — 全部功能可通过 TalkBack、Switch Access、键盘操作
- **R6.13** — Canvas 自绘视图必须通过 `ExploreByTouchHelper` 构建虚拟无障碍树

---

## 7. 手势与输入 [MEDIUM]

- **R7.1** — 不在系统手势区域放置交互元素
- **R7.2** — 使用 `WindowInsets.systemGestures` 检测冲突区域
- **R7.3** — 滑动删除必须可撤销或需确认
- **R7.4** — 所有手势操作必须有非手势替代方式
- **R7.5** — 所有可点击元素添加 Material 涟漪效果
- **R7.6** — 长按触发上下文菜单，但长按不能是唯一入口
- **R7.7** — 长按操作附带触觉反馈

---

## 8. 通知 [MEDIUM]

- **R8.1** — 每种通知类型使用独立 Channel
- **R8.2** — 保守选择 importance 级别
- **R8.3** — 所有通知必须有点击动作
- **R8.4** — 通知图标提供 `contentDescription`
- **R8.5** — 会话通知使用 `MessagingStyle`
- **R8.6** — 消息通知提供直接回复 action
- **R8.7** — 消息通知提供"标为已读" action
- **R8.8** — 富内容使用可展开样式
- **R8.9** — 前台服务通知描述正在进行的操作 + 提供停止按钮

---

## 9. 权限与隐私 [HIGH]

- **R9.1** — 在功能使用时请求权限，不在启动时批量请求
- **R9.2** — 请求前展示理由说明
- **R9.3** — 权限被拒后优雅降级，不阻塞核心功能
- **R9.4** — 不请求非必要权限
- **R9.5** — 选择照片用 Photo Picker，不申请 `READ_MEDIA_IMAGES`
- **R9.6** — 除非精确定位必不可少，优先用 `ACCESS_COARSE_LOCATION`
- **R9.7** — 非录制场景对相机/麦克风使用一次性权限
- **R9.8** — 相机/麦克风使用中显示隐私指示器

---

## 10. 系统集成 [MEDIUM]

- **R10.1** — Widget 使用 Glance API，支持动态颜色
- **R10.2** — Widget 放置后必须立即可用
- **R10.3** — 实际可行时提供多种 Widget 尺寸
- **R10.4** — Widget 圆角匹配系统 Widget 形状
- **R10.5** — 2-4 个静态快捷方式；按需支持动态快捷方式
- **R10.6** — 快捷方式图标：简单剪影 + 圆形背景
- **R10.7** — 长按和设置中都测试快捷方式
- **R10.8** — 公开内容 URL 使用 Android App Links
- **R10.9** — 分享时提供富预览
- **R10.10** — 处理传入的分享 Intent，按内容类型过滤

---

## 交叉引用

| 主题 | 主要章节 | 另见 |
|------|----------|------|
| 深色主题 | 1.3 | 6.7（对比度） |
| 触摸目标 | 6.5 | 7.1（手势区域） |
| 系统栏 | 3.3 | 7.1（手势 insets） |
| FAB 定位 | 5.1 | 2.2（Rail 顶部 FAB）、5.15（Snackbar） |
| 字体缩放 | 4.1 | 4.4（200% 测试）、6.9（粗体文本） |
| 权限 | 9.1 | 9.5（Photo Picker） |
| 导航选型 | 2（表格） | 3.1（Window Size Class） |
| 颜色角色 | 1.2 | 2.4（导航指示器）、5.3（FAB 颜色） |
