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
