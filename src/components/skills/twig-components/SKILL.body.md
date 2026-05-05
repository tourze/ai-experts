## 核心约束

- 先判断组件类型：静态可复用 UI 用 TwigComponent，交互后需要服务端重渲染时再上 LiveComponent。
- 组件公共属性必须稳定、可命名、可组合，避免把页面级上下文隐式塞进组件内部。
- 模板只负责展示，不要在 Twig 里堆复杂业务判断或副作用。
- LiveComponent 的可写状态必须显式标记为 `LiveProp(writable: true)`，不要靠隐式提交。
- 组件应该复用现有样式和路由，不要为了抽组件而重造一层平行 UI 体系。

## 代码模式

```php
<?php

namespace App\Twig\Components;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

#[AsTwigComponent]
final class Alert
{
    public string $type = 'info';
    public string $message = '';
}
```

```twig
{# templates/components/Alert.html.twig #}
<div class="alert alert-{{ type }}" {{ attributes }}>
    {{ message }}
</div>
```

```php
<?php

namespace App\Twig\Components;

use App\Repository\ProductRepository;
use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\DefaultActionTrait;

#[AsLiveComponent]
final class ProductSearch
{
    use DefaultActionTrait;

    #[LiveProp(writable: true, url: true)]
    public string $query = '';

    public function __construct(
        private readonly ProductRepository $products,
    ) {}

    public function getResults(): array
    {
        if (mb_strlen($this->query) < 2) {
            return [];
        }

        return $this->products->search($this->query);
    }
}
```

```twig
{# templates/components/ProductSearch.html.twig #}
<div {{ attributes }}>
    <input data-model="debounce(300)|query" placeholder="搜索产品">

    {% for product in this.results %}
        <div>{{ product.name }}</div>
    {% else %}
        {% if query|length >= 2 %}
            <div>没有匹配结果。</div>
        {% endif %}
    {% endfor %}
</div>
```

## 检查清单

- 组件职责是否单一，且名字能准确表达它提供的 UI 能力。
- 公共属性、slots、`attributes` 合并策略是否清晰，而不是依赖模板外部魔法变量。
- LiveComponent 是否只暴露必要的可写状态，并处理了空值、快速输入和重复请求。
- 组件模板是否避免直接访问全局状态，改为通过显式 props 或 getter 输入。
- 相同样式或交互是否已经有现成组件可复用，避免再造近似组件。

## 反模式

### FAIL: 静态展示上 LiveComponent

```php
#[AsLiveComponent]
final class Alert {
    #[LiveProp] public string $type = 'info';
    #[LiveProp] public string $message = '';
}
// 纯静态告警，平白增加 AJAX 往返 + 状态序列化
```

### PASS: 静态用 TwigComponent

```php
#[AsTwigComponent]
final class Alert {
    public string $type = 'info';
    public string $message = '';
}
```

### FAIL: 模板里写业务逻辑

```twig
{% set orders = db_query('SELECT * FROM orders WHERE user_id = ' ~ app.user.id) %}
{% for order in orders %}...{% endfor %}
```

### PASS: 通过显式 props 输入

```twig
{# 组件只接收已准备好的数据 #}
{% for order in orders %}<div>{{ order.title }}</div>{% endfor %}
{# Controller 或 Component 类负责查询并传入 orders #}
```
