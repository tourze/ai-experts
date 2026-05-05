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
