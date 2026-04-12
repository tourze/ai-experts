# 参考文档

# Twig 组件 (Symfony UX)

## 安装

```bash
composer require symfony/ux-twig-component
# 安装响应式组件
composer require symfony/ux-live-component
```

## 基础 Twig 组件

### 创建组件类

```php
<?php
// src/Twig/Components/Alert.php

namespace App\Twig\Components;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

#[AsTwigComponent]
class Alert
{
    public string $type = 'info';
    public string $message;
    public bool $dismissible = false;
}
```

### 创建模板

```twig
{# templates/components/Alert.html.twig #}
<div class="alert alert-{{ type }}{% if dismissible %} alert-dismissible{% endif %}" role="alert">
    {{ message }}
    {% if dismissible %}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    {% endif %}
</div>
```

### 使用组件

```twig
{# 在任意模板中 #}
<twig:Alert type="success" message="Operation completed!" />
<twig:Alert type="danger" message="An error occurred" dismissible />
```

## 带插槽的组件

### 组件类

```php
<?php
// src/Twig/Components/Card.php

namespace App\Twig\Components;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

#[AsTwigComponent]
class Card
{
    public ?string $title = null;
    public string $class = '';
}
```

### 带插槽的模板

```twig
{# templates/components/Card.html.twig #}
<div class="card {{ class }}">
    {% if title %}
        <div class="card-header">
            <h5 class="card-title">{{ title }}</h5>
        </div>
    {% endif %}

    <div class="card-body">
        {% block content %}{% endblock %}
    </div>

    {% if block('footer') is not empty %}
        <div class="card-footer">
            {% block footer %}{% endblock %}
        </div>
    {% endif %}
</div>
```

### 使用方式

```twig
<twig:Card title="User Profile">
    <twig:block name="content">
        <p>Name: {{ user.name }}</p>
        <p>Email: {{ user.email }}</p>
    </twig:block>

    <twig:block name="footer">
        <a href="{{ path('user_edit', {id: user.id}) }}" class="btn btn-primary">Edit</a>
    </twig:block>
</twig:Card>
```

## 带逻辑的组件

```php
<?php
// src/Twig/Components/UserCard.php

namespace App\Twig\Components;

use App\Entity\User;
use App\Repository\PostRepository;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

#[AsTwigComponent]
class UserCard
{
    public User $user;

    public function __construct(
        private PostRepository $postRepository,
    ) {}

    public function getPostCount(): int
    {
        return $this->postRepository->countByAuthor($this->user);
    }

    public function getRecentPosts(): array
    {
        return $this->postRepository->findRecentByAuthor($this->user, 3);
    }
}
```

```twig
{# templates/components/UserCard.html.twig #}
<div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ this.postCount }} posts</p>

    <ul>
    {% for post in this.recentPosts %}
        <li>{{ post.title }}</li>
    {% endfor %}
    </ul>
</div>
```

## Live 组件（响应式）

### 计数器示例

```php
<?php
// src/Twig/Components/Counter.php

namespace App\Twig\Components;

use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\Attribute\LiveAction;
use Symfony\UX\LiveComponent\DefaultActionTrait;

#[AsLiveComponent]
class Counter
{
    use DefaultActionTrait;

    #[LiveProp(writable: true)]
    public int $count = 0;

    #[LiveAction]
    public function increment(): void
    {
        $this->count++;
    }

    #[LiveAction]
    public function decrement(): void
    {
        $this->count--;
    }
}
```

```twig
{# templates/components/Counter.html.twig #}
<div {{ attributes }}>
    <span>Count: {{ count }}</span>
    <button data-action="live#action" data-live-action-param="decrement">-</button>
    <button data-action="live#action" data-live-action-param="increment">+</button>
</div>
```

### 搜索组件

```php
<?php
// src/Twig/Components/ProductSearch.php

namespace App\Twig\Components;

use App\Repository\ProductRepository;
use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\DefaultActionTrait;

#[AsLiveComponent]
class ProductSearch
{
    use DefaultActionTrait;

    #[LiveProp(writable: true, url: true)]
    public string $query = '';

    #[LiveProp(writable: true)]
    public int $page = 1;

    public function __construct(
        private ProductRepository $products,
    ) {}

    public function getProducts(): array
    {
        if (strlen($this->query) < 2) {
            return [];
        }

        return $this->products->search($this->query, $this->page);
    }
}
```

```twig
{# templates/components/ProductSearch.html.twig #}
<div {{ attributes }}>
    <input
        type="search"
        data-model="query"
        placeholder="Search products..."
        class="form-control"
    >

    <div class="results mt-3">
        {% for product in this.products %}
            <div class="product-card">
                <h4>{{ product.name }}</h4>
                <p>{{ product.price|format_currency('EUR') }}</p>
            </div>
        {% else %}
            {% if query|length >= 2 %}
                <p>未找到产品。</p>
            {% endif %}
        {% endfor %}
    </div>
</div>
```

### 表单组件

```php
<?php
// src/Twig/Components/ContactForm.php

namespace App\Twig\Components;

use App\Form\ContactType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\FormInterface;
use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\Attribute\LiveAction;
use Symfony\UX\LiveComponent\ComponentWithFormTrait;
use Symfony\UX\LiveComponent\DefaultActionTrait;

#[AsLiveComponent]
class ContactForm extends AbstractController
{
    use ComponentWithFormTrait;
    use DefaultActionTrait;

    #[LiveProp]
    public bool $submitted = false;

    protected function instantiateForm(): FormInterface
    {
        return $this->createForm(ContactType::class);
    }

    #[LiveAction]
    public function submit(): void
    {
        $this->submitForm();

        if ($this->getForm()->isValid()) {
            $data = $this->getForm()->getData();
            // 处理表单...
            $this->submitted = true;
        }
    }
}
```

```twig
{# templates/components/ContactForm.html.twig #}
<div {{ attributes }}>
    {% if submitted %}
        <div class="alert alert-success">感谢您的留言！</div>
    {% else %}
        {{ form_start(form) }}
            {{ form_row(form.name) }}
            {{ form_row(form.email) }}
            {{ form_row(form.message) }}

            <button
                type="submit"
                data-action="live#action"
                data-live-action-param="submit"
                class="btn btn-primary"
            >
                Send
            </button>
        {{ form_end(form) }}
    {% endif %}
</div>
```

## 最佳实践

1. **保持组件职责单一**：单一职责原则
2. **使用插槽增加灵活性**：允许内容注入
3. **用 LiveProp 管理状态**：显式标记可写属性
4. **搜索防抖**：使用 `data-model="debounce(300)|query"`
5. **URL 同步**：使用 `url: true` 实现可书签化的状态
6. **测试组件**：对 PHP 类进行单元测试


## Skill 操作检查清单

### 设计检查清单
- 首先确认操作边界和不变量。
- 在保持契约正确性的前提下最小化范围。
- 同时测试正常路径和异常路径行为。

### 验证命令
- rg --files
- composer validate
- ./vendor/bin/phpstan analyse

### 需要测试的失败模式
- 无效负载或未授权操作者。
- 边界值/未找到的情况。
- 异步流程的重试或部分失败行为。
