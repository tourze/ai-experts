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

## 反模式

### FAIL: 纯展示用 LiveComponent

```twig
{# UserCard 只展示数据，不需要交互 #}
{# 但用了 LiveComponent #}
<twig:UserCard :user="user" />
```
```
每次父组件渲染 → POST /_components → 服务端渲染 → 网络往返
1 个列表页 50 张卡片 = 50 个请求
```

### PASS: 纯展示用 TwigComponent

```twig
{# TwigComponent 在服务端一次性渲染 #}
<twig:UserCard :user="user" />
```
```
0 网络请求，纯模板抽象
LiveComponent 留给真正需要响应式的场景（搜索、过滤、表单）
```

### FAIL: Turbo + Stimulus 抢同一块 DOM

```twig
<turbo-frame id="form-area">
  <form data-controller="form-submit"
        data-action="submit->form-submit#handle">
    {# Stimulus handle 内部 fetch + 替换 DOM #}
    {# 同时 Turbo 也在拦截 form submit #}
  </form>
</turbo-frame>
```
```
两个机制争抢提交事件 → 状态错乱、双重提交
```

### PASS: 单一机制主导

```twig
{# 局部刷新交给 Turbo，Stimulus 只做附加交互 #}
<turbo-frame id="form-area">
  <form data-controller="char-counter">  {# 仅字数统计 #}
    <textarea data-action="input->char-counter#update"></textarea>
    <span data-char-counter-target="count">0</span>
    {# submit 交给 Turbo，刷新 frame #}
  </form>
</turbo-frame>
```
