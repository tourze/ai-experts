---
name: symfony-ux
description: 选择和组合 Symfony UX 前端栈，覆盖 Stimulus、Turbo、TwigComponent、LiveComponent、UX Icons 与 UX Map 的取舍与协作方式
---

# Symfony UX

## 适用场景

- 需要在 Symfony 项目里判断应该用 Stimulus、Turbo、TwigComponent、LiveComponent、UX Icons 还是 UX Map。
- 页面已经是服务端渲染，但又需要局部导航、表单交互、实时搜索或第三方 JS 增强。
- 想把“尽量少写前端框架代码”的思路落到具体组件与页面结构上。
- 如果已经明确要抽取组件，可直接联动 [twig-components](../twig-components/SKILL.md)；如果页面交互最终要进入异步任务，可联动 [symfony-messenger](../symfony-messenger/SKILL.md)。

## 核心约束

- 渐进增强优先：先保证 HTML 和服务端渲染可用，再叠加交互能力。
- 选最简单的工具：Turbo 能解决的不要先上 Stimulus，TwigComponent 能解决的不要直接上 LiveComponent。
- LiveComponent 只用于确实需要服务端参与的交互；纯前端状态切换优先 Stimulus。
- 一个页面可以组合多种 UX 工具，但边界必须清楚，避免 Turbo、Stimulus 和 LiveComponent 同时争抢同一块 DOM。
- 图标和地图属于辅助能力，不要让它们主导页面架构。

## 代码模式

```twig
{# Turbo Frame：适合局部区域导航或分页 #}
<turbo-frame id="order-list">
    {% for order in orders %}
        <a href="{{ path('order_show', {id: order.id}) }}">{{ order.number }}</a>
    {% endfor %}
</turbo-frame>
```

```twig
{# Stimulus：适合纯前端行为或第三方库集成 #}
<div data-controller="dropdown">
    <button data-action="click->dropdown#toggle">切换菜单</button>
    <div data-dropdown-target="menu" hidden>...</div>
</div>
```

```twig
{# LiveComponent：适合需要服务端参与的响应式交互 #}
<div {{ attributes }}>
    <input data-model="debounce(300)|query" placeholder="搜索产品">

    {% for product in this.results %}
        <div>{{ product.name }}</div>
    {% endfor %}
</div>
```

```twig
{# UX Icons：内联 SVG #}
<twig:ux:icon name="lucide:check" class="icon icon-success" />
```

## 检查清单

- 当前交互是否真的需要服务端参与，还是前端行为就够了。
- 页面是否先从 Turbo Drive / Frame 方案思考，再决定是否追加 Stimulus。
- 组件化需求是否已经沉淀到 [twig-components](../twig-components/SKILL.md) 中，而不是散落在普通模板。
- 同一块 UI 是否只有一个主导机制，避免多套状态源同时控制。
- 图标、地图、实时搜索等增强能力是否保持在页面边界内，没有侵入业务核心流程。

## 反模式

- 还没判断需求，就先把页面重写成重型前端框架心智模型。
- 用 Stimulus 接管表单提交和局部刷新，结果和 Turbo 行为互相打架。
- 对纯展示组件使用 LiveComponent，把简单页面做成请求风暴。
- 一个 DOM 区域同时由 Turbo Stream、LiveComponent 和手写 JS 改写，最终状态不可预测。
- 只因为 UX Icons / UX Map 好用，就在页面里散落大量无约束的视觉增强逻辑。
