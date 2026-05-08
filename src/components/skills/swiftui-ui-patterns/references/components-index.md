# 组件索引

使用此文件查找特定组件的指导。每个条目列出了何时使用它。

## 可用组件

- TabView：`references/tabview.md` — 构建基于标签页的应用或任何标签式功能集时使用。
- NavigationStack：`references/navigationstack.md` — 需要推送导航和编程式路由时使用，特别是每标签页历史。
- Sheets 和模态路由：`references/sheets.md` — 需要集中式、枚举驱动的 sheet 展示时使用。
- App 连接与依赖图：`references/app-wiring.md` — 在根视图连接 TabView + NavigationStack + sheets 并安装全局依赖时使用。
- 表单和设置：`references/form.md` — 用于设置、分组输入和结构化数据录入。
- macOS 设置：`references/macos-settings.md` — 使用 SwiftUI 的 Settings 场景构建 macOS 设置窗口时使用。
- 分割视图和列：`references/split-views.md` — 用于 iPad/macOS 多列布局或自定义副列。
- 列表和 Section：`references/list.md` — 用于 Feed 类型内容和设置行。
- ScrollView 和 Lazy 堆栈：`references/scrollview.md` — 用于自定义布局、水平滚动器或网格。
- 网格：`references/grids.md` — 用于图标选择器、媒体库和磁贴布局。
- 主题和动态类型：`references/theming.md` — 用于应用范围的主题令牌、颜色和字号缩放。
- 控件（Toggle、Picker、Slider）：`references/controls.md` — 用于设置控件和输入选择。
- 输入工具栏（底部固定）：`references/input-toolbar.md` — 用于具有固定输入栏的聊天/编辑器界面。
- 顶部栏覆盖（iOS 26+ 及降级方案）：`references/top-bar.md` — 用于滚动内容上方的固定选择器或胶囊。
- 覆盖层和 Toast：`references/overlay.md` — 用于临时 UI，如横幅或 Toast。
- 焦点处理：`references/focus.md` — 用于字段链和键盘焦点管理。
- 可搜索：`references/searchable.md` — 用于带有范围和异步结果的原生搜索 UI。
- 异步图片和媒体：`references/media.md` — 用于远程媒体、预览和媒体查看器。
- 触觉反馈：`references/haptics.md` — 用于与关键操作关联的触觉反馈。
- 匹配过渡：`references/matched-transitions.md` — 用于平滑的源到目标动画。
- 深度链接和 URL 路由：`references/deeplinks.md` — 用于从 URL 进行应用内导航。
- 标题菜单：`references/title-menus.md` — 用于导航标题中的筛选或上下文菜单。
- 菜单栏命令：`references/menu-bar.md` — 添加或自定义 macOS/iPadOS 菜单栏命令时使用。
- 加载与占位符：`references/loading-placeholders.md` — 用于脱敏骨架屏、空状态和加载 UX。
- 轻量级客户端：`references/lightweight-clients.md` — 用于注入到 store 中的小型、闭包式 API 客户端。

## 计划组件（按需创建文件）

- Web 内容：创建 `references/webview.md` — 用于嵌入式 Web 内容或应用内浏览。
- 状态编辑器模式：创建 `references/composer.md` — 用于编辑或撰写工作流。
- 文本输入和验证：创建 `references/text-input.md` — 用于表单、验证和大量文本输入。
- 设计系统使用：创建 `references/design-system.md` — 应用共享样式规则时使用。

## 添加条目

- 添加组件文件并在此处链接，附带简短的"使用时机"描述。
- 保持每个组件引用简短且可操作。
