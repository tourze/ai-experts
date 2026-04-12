---
name: symfony-ux
description: Symfony UX 前端技术栈——用于在 Stimulus、Turbo、TwigComponent、LiveComponent、UX Icons 和 UX Map 之间做决策的决策树与编排器。当用户不确定应该使用哪个工具、想组合多个 UX 包、或在 Symfony 中提出前端架构问题时触发。也在用户问"应该用哪个 UX 包"、"怎么让页面有交互性"、"用 Stimulus 还是 LiveComponent"、"如何组织 Symfony 前端结构"、"Turbo 和 LiveComponent 有什么区别"、"这里用 Frame 还是 LiveComponent"、"这些 UX 包怎么配合使用"、"Symfony 的前端方式是什么"时触发。当用户明确指定了具体工具（stimulus、turbo、twig-component、live-component、ux-icons、ux-map）时不要触发——交给专用 skill 处理。
license: MIT
metadata:
  author: Simon Andre
  email: smn.andre@gmail.com
  url: https://smnandre.dev
  version: "1.0"
---

# Symfony UX

Symfony 的现代前端技术栈。使用服务端渲染的 HTML 构建响应式 UI，将 JavaScript 的使用降到最低。

Symfony UX 遵循渐进增强的理念：从纯 HTML 开始，仅在需要时添加交互性，优先使用服务端渲染而非客户端 JavaScript。每个工具解决一个特定问题——选择最简单的那个。

## 决策树：该用哪个工具？

```
需要前端交互？
|
+-- 纯 JavaScript 行为（不需要服务端）？
|   -> Stimulus
|      （DOM 操作、事件处理、第三方库集成）
|
+-- 导航/局部页面更新？
|   -> Turbo
|      +-- 整页 AJAX        -> Turbo Drive（自动化，零配置）
|      +-- 单个区域更新     -> Turbo Frame
|      +-- 多个区域更新     -> Turbo Stream
|
+-- 可复用的 UI 组件？
|   |
|   +-- 静态（无实时更新）？
|   |   -> TwigComponent
|   |      （props、blocks、计算属性）
|   |
|   +-- 动态（交互时重新渲染）？
|       -> LiveComponent
|          （数据绑定、actions、表单、实时验证）
|
+-- 需要图标？
|   -> UX Icons
|      （来自 200+ Iconify 图标集或本地文件的内联 SVG）
|
+-- 需要交互式地图？
|   -> UX Map
|      （Leaflet 或 Google Maps，标记、多边形、圆形）
|
+-- 实时通信（WebSocket/SSE）？
    -> Turbo Stream + Mercure
```

这些工具天然可以组合使用。典型页面使用 Turbo Drive 处理导航，Turbo Frames 处理局部区域，TwigComponents 构建可复用 UI 元素，LiveComponents 实现响应式表单/搜索，Stimulus 处理不需要服务端往返的客户端行为。

## 快速对比

| 特性 | Stimulus | Turbo | TwigComponent | LiveComponent |
|------|----------|-------|---------------|---------------|
| 需要 JavaScript | 是（少量） | 否 | 否 | 否 |
| 服务端重新渲染 | 否 | 是（整页/Frame） | 否 | 是（AJAX） |
| 状态管理 | 仅 JS | URL/服务端 | Props（不可变） | LiveProp（可变） |
| 双向绑定 | 手动 | 否 | 否 | data-model |
| 实时能力 | 手动 | 是（Streams+Mercure） | 否 | 是（轮询/emit） |
| 懒加载 | 是（stimulusFetch） | 是（lazy frames） | 否 | 是（defer/lazy） |

**UX Icons** 和 **UX Map** 是辅助上述工具的实用包。Icons 提供内联 SVG 渲染（本地文件 + 200,000+ Iconify 图标）。Map 提供交互式地图（Leaflet 或 Google Maps），配置以 PHP 为主。两者都可在 TwigComponents、LiveComponents 和 Turbo Frames 内使用。Map 还提供专用的 `ComponentWithMapTrait`，用于在 LiveComponents 中实现响应式地图。

## 安装

```bash
# 所有核心包
composer require symfony/ux-turbo symfony/stimulus-bundle \
    symfony/ux-twig-component symfony/ux-live-component

# 单独安装
composer require symfony/stimulus-bundle      # Stimulus
composer require symfony/ux-turbo             # Turbo
composer require symfony/ux-twig-component    # TwigComponent
composer require symfony/ux-live-component    # LiveComponent（包含 TwigComponent）
composer require symfony/ux-icons             # UX Icons
composer require symfony/ux-map               # UX Map（然后添加下面的渲染器）
composer require symfony/ux-leaflet-map       # Leaflet 渲染器（免费）
composer require symfony/ux-google-map        # Google Maps 渲染器（需要 API 密钥）
```

## 常见模式

### 模式 1：静态组件（TwigComponent）

无交互的可复用 UI。适用于按钮、卡片、提示框、徽章。

```php
#[AsTwigComponent]
final class Alert
{
    public string $type = 'info';
    public string $message;
}
```

```twig
{# templates/components/Alert.html.twig #}
<div class="alert alert-{{ type }}" {{ attributes }}>
    {{ message }}
</div>
```

```twig
<twig:Alert type="success" message="Saved!" />
```

### 模式 2：组件 + JS 行为（TwigComponent + Stimulus）

服务端渲染的组件搭配客户端交互。适用于交互纯粹是视觉效果（切换、动画、第三方 JS 库）且不需要服务端数据的场景。

```php
#[AsTwigComponent]
final class Dropdown
{
    public string $label;
}
```

```twig
{# templates/components/Dropdown.html.twig #}
<div data-controller="dropdown" {{ attributes }}>
    <button data-action="click->dropdown#toggle">{{ label }}</button>
    <div data-dropdown-target="menu" hidden>
        {% block content %}{% endblock %}
    </div>
</div>
```

### 模式 3：服务端响应式组件（LiveComponent）

通过 AJAX 在用户输入时重新渲染的组件。适用于搜索框、筛选器、带实时验证的表单，以及每次交互都需要服务端数据的场景。

```php
#[AsLiveComponent]
final class SearchBox
{
    use DefaultActionTrait;

    #[LiveProp(writable: true, url: true)]
    public string $query = '';

    public function __construct(
        private readonly ProductRepository $products,
    ) {}

    public function getResults(): array
    {
        return $this->products->search($this->query);
    }
}
```

```twig
<div {{ attributes }}>
    <input data-model="debounce(300)|query" placeholder="Search...">
    <div data-loading="addClass(opacity-50)">
        {% for item in this.results %}
            <div>{{ item.name }}</div>
        {% endfor %}
    </div>
</div>
```

### 模式 4：基于 Frame 的导航（Turbo Frame）

无需整页刷新的局部页面更新。适用于分页、内联编辑、标签页内容、从服务端加载的模态框。

```twig
<turbo-frame id="product-list">
    {% for product in products %}
        <a href="{{ path('product_show', {id: product.id}) }}">
            {{ product.name }}
        </a>
    {% endfor %}
</turbo-frame>
```

### 模式 5：多区域更新（Turbo Stream）

通过单个服务端响应更新页面的多个区域。适用于表单提交后影响页面多个部分的场景。

```php
#[Route('/comments', methods: ['POST'])]
public function create(Request $request): Response
{
    // ... 保存评论

    $request->setRequestFormat(TurboBundle::STREAM_FORMAT);
    return $this->render('comment/create.stream.html.twig', [
        'comment' => $comment,
        'count' => $count,
    ]);
}
```

```twig
{# create.stream.html.twig #}
<turbo-stream action="append" target="comments">
    <template>{{ include('comment/_comment.html.twig') }}</template>
</turbo-stream>
<turbo-stream action="update" target="comment-count">
    <template>{{ count }}</template>
</turbo-stream>
```

也可以使用 Twig 组件语法：

```twig
<twig:Turbo:Stream:Append target="comments">
    {{ include('comment/_comment.html.twig') }}
</twig:Turbo:Stream:Append>
```

### 模式 6：Turbo Frame 内嵌 LiveComponent

组合使用以构建复杂 UI——Frame 限定导航范围，LiveComponent 在该范围内处理响应式交互。

```twig
<turbo-frame id="search-section">
    <twig:ProductSearch />
</turbo-frame>
```

### 模式 7：实时更新（Mercure + Turbo Stream）

通过 SSE 将服务端事件广播到所有已连接的浏览器。

```php
use Symfony\UX\Turbo\Attribute\Broadcast;

#[Broadcast]
class Message
{
    // 实体变更会自动广播
}
```

```twig
<turbo-stream-source src="{{ mercure('chat')|escape('html_attr') }}">
</turbo-stream-source>
<div id="messages">...</div>
```

## 何时使用什么

**Stimulus** ——为已有 HTML 添加 JS 行为、集成第三方库（图表、日期选择器、地图）、仅客户端的交互（切换、标签页、剪贴板），以及需要完全控制 JavaScript 执行的场景。

**Turbo Drive** ——类 SPA 导航。自动化，零配置。安装后所有链接/表单自动变为 AJAX。使用 `data-turbo="false"` 选择性退出。

**Turbo Frames** ——加载或更新单个页面区域：内联编辑、区域内分页、模态框内容加载、懒加载侧边栏。

**Turbo Streams** ——同时更新多个页面区域、实时广播（配合 Mercure）、表单提交后的闪存消息、删除确认同时更新列表和计数器。

**TwigComponent** ——可复用 UI 元素（按钮、卡片、提示框、表单组件）、统一的样式和标记、初始渲染后不需要服务端交互、组件组合与嵌套。

**LiveComponent** ——带实时验证的表单、实时搜索结果、数据绑定（类似 Vue/React 但服务端渲染）、任何状态会随用户交互变化的组件、希望完全避免编写 JavaScript 的场景。

**UX Icons** ——在模板中渲染 SVG 图标。支持 200+ Iconify 图标集（Lucide、Tabler、Heroicons、MDI...）和本地 SVG 文件。图标以 `<svg>` 内联渲染——无图标字体、无运行时 HTTP 请求。使用 `<twig:ux:icon name="lucide:check" />`。

**UX Map** ——显示带标记、多边形、折线、圆形和信息窗口的交互式地图。在 PHP 中构建地图（`new Map()`），在 Twig 中渲染（`ux_map(map)`）。支持 Leaflet（免费）和 Google Maps。通过 `ComponentWithMapTrait` 在 LiveComponents 中实现响应式地图。

## 工具组合

```
+-----------------------------------------------------+
|                     页面                             |
|  +------------------------------------------------+ |
|  | Turbo Drive（自动整页 AJAX）                    | |
|  |  +------------------------------------------+  | |
|  |  | Turbo Frame（局部区域）                   |  | |
|  |  |  +------------------------------------+  |  | |
|  |  |  | LiveComponent（响应式）             |  |  | |
|  |  |  |  +------------------------------+  |  |  | |
|  |  |  |  | TwigComponent（静态）         |  |  |  | |
|  |  |  |  |  + Stimulus（JS 行为）        |  |  |  | |
|  |  |  |  +------------------------------+  |  |  | |
|  |  |  +------------------------------------+  |  | |
|  |  +------------------------------------------+  | |
|  +------------------------------------------------+ |
+-----------------------------------------------------+
```

## 文件结构

```
src/
  Twig/
    Components/
      Alert.php              # TwigComponent
      Button.php             # TwigComponent
      SearchBox.php          # LiveComponent
      ProductForm.php        # LiveComponent

templates/
  components/
    Alert.html.twig
    Button.html.twig
    SearchBox.html.twig
    ProductForm.html.twig

assets/
  controllers/
    dropdown_controller.js   # Stimulus
    modal_controller.js      # Stimulus
    chart_controller.js      # Stimulus
  icons/
    close.svg                # UX Icons（本地）
    header/
      logo.svg               # UX Icons（命名空间：header:logo）
```

## 应避免的反模式

**不要对静态内容使用 LiveComponent。** 如果组件在初始加载后不会重新渲染，请使用 TwigComponent——LiveComponent 会增加不必要的开销（AJAX 请求、状态序列化）。

**Turbo Frame 足够时不要使用 Turbo Streams。** 如果只需更新页面的一个区域，Turbo Frame 更简单，且不需要特殊的响应格式。

**Turbo 能处理时不要用 Stimulus。** 在为链接或表单交互编写 Stimulus 控制器之前，先检查 Turbo Drive/Frames 是否已能处理。

**不要与 Turbo Drive 对抗。** 如果链接或表单在 Turbo 下行为异常，修复方法通常是确保服务端返回完整的 HTML 页面，而不是禁用 Turbo。

## Icons 和 Map 的反模式

**有 UX Icons 时不要使用图标字体。** 内联 SVG 更具可访问性、更易样式化，且不需要额外的 HTTP 请求。

**有标记点时不要硬编码地图中心/缩放级别。** 使用 `fitBoundsToMarkers()` 自动适配视口。

**不要忘记给地图容器设置显式高度。** 否则 `<div>` 会坍缩为 0px，地图将不可见。

**部署时不要启用按需图标加载。** 部署前运行 `php bin/console ux:icons:lock` 以避免运行时向 Iconify API 发起 HTTP 请求。

## 相关 Skill

每个工具的详细文档请参阅专用 skill：
- **Stimulus**：控制器、targets、values、actions、outlets、懒加载
- **Turbo**：Drive、Frames、Streams、Mercure 集成、`<twig:Turbo:Stream:*>` 组件
- **TwigComponent**：Props、blocks、计算属性、匿名组件、attributes
- **LiveComponent**：LiveProp、LiveAction、data-model、表单、emit/listen、轮询、defer/lazy
- **UX Icons**：Iconify 按需加载、本地 SVG、图标集、别名、`ux:icons:lock` CLI
- **UX Map**：Leaflet/Google Maps、标记、多边形、折线、圆形、`ComponentWithMapTrait`
