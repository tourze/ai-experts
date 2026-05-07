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
