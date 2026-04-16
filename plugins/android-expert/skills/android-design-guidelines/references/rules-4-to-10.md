# Android 设计规范 — 规则 4-10

本文件是 SKILL.md 的拆分内容，包含排版、组件、无障碍、手势、通知、权限、系统集成的完整规则。

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

## 5. 组件 [HIGH]

- **R5.1** — 每个屏幕最多一个 FAB，定位右下角，默认 `primaryContainer`
- **R5.2-R5.4** — 优先 `ExtendedFloatingActionButton`
- **R5.5-R5.7** — Top App Bar 与滚动联动，操作图标 ≤ 3
- **R5.8-R5.10** — Bottom Sheet: Modal 补充 / Standard 持久 / 拖拽手柄
- **R5.11-R5.13** — Dialog 仅关键决策 / 确认为文本按钮
- **R5.14-R5.16** — Snackbar 简短反馈 / 可撤销附 undo
- **R5.17-R5.18** — Chip 按类型选 / 水平排列
- **R5.19** — 立即展示等待状态

| 需求 | 推荐组件 |
|------|----------|
| 页面主操作 | FAB / ExtendedFAB |
| 页面标题 + 操作 | Top App Bar |
| 补充操作面板 | Bottom Sheet |
| 关键确认 | AlertDialog |
| 简短反馈 | Snackbar |
| 过滤/选择标签 | FilterChip |

## 6. 无障碍 [CRITICAL]

- **R6.1-R6.4** — contentDescription / mergeDescendants / customActions
- **R6.5-R6.6** — 触摸目标 ≥ 48×48dp
- **R6.7-R6.9** — 对比度 ≥ 4.5:1 / 不仅靠颜色 / 支持粗体+高对比
- **R6.10-R6.12** — 焦点顺序 / TalkBack / Switch Access / 键盘
- **R6.13** — Canvas 自绘用 ExploreByTouchHelper

## 7. 手势与输入 [MEDIUM]

- **R7.1-R7.2** — 不在系统手势区放交互 / WindowInsets.systemGestures
- **R7.3-R7.4** — 滑动删除可撤销 / 手势有非手势替代
- **R7.5-R7.7** — 涟漪 / 长按上下文菜单 / 触觉反馈

## 8. 通知 [MEDIUM]

- **R8.1-R8.4** — 独立 Channel / importance 保守 / 点击动作 / contentDescription
- **R8.5-R8.7** — MessagingStyle / 直接回复 / 标为已读
- **R8.8-R8.9** — 可展开样式 / 前台服务通知

## 9. 权限与隐私 [HIGH]

- **R9.1-R9.4** — 按需请求 / 理由说明 / 优雅降级 / 最小权限
- **R9.5-R9.8** — Photo Picker / 粗略定位 / 一次性权限 / 隐私指示器

## 10. 系统集成 [MEDIUM]

- **R10.1-R10.4** — Widget Glance API / 即时可用 / 多尺寸 / 匹配圆角
- **R10.5-R10.7** — 快捷方式 / 图标 / 测试
- **R10.8-R10.10** — App Links / 富预览 / 分享 Intent

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
