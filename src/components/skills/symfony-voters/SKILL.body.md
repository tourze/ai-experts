## 代码模式

```php
<?php

namespace App\Security\Voter;

use App\Entity\Post;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class PostVoter extends Voter
{
    public const EDIT = 'POST_EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EDIT && $subject instanceof Post;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof \App\Entity\User) {
            return false;
        }

        return $subject->getAuthor()?->getId() === $user->getId();
    }
}
```

```php
<?php

#[\Symfony\Component\Routing\Attribute\Route('/posts/{id}/edit', methods: ['GET', 'POST'])]
public function edit(Post $post): \Symfony\Component\HttpFoundation\Response
{
    $this->denyAccessUnlessGranted(PostVoter::EDIT, $post);

    // 只在通过授权后继续处理表单。
}
```

```twig
{% if is_granted(constant('App\\\\Security\\\\Voter\\\\PostVoter::EDIT'), post) %}
    <a href="{{ path('post_edit', {id: post.id}) }}">编辑</a>
{% endif %}
```

## 检查清单

- 是否先画清楚“操作者 / 资源 / 动作”的决策矩阵，再写代码。
- `supports()` 是否足够收敛，避免把不相关的 subject 吃进去。
- 拒绝路径是否稳定且默认安全，没有把敏感原因暴露给前端。
- Controller、模板和 API 入口是否共用同一授权属性，而不是分叉实现。
- 是否覆盖匿名用户、普通用户、资源所有者、管理员和资源不存在等测试场景。

## 反模式

### FAIL: Controller 手写角色判断

```php
public function edit(Post $post): Response {
    if (!$this->getUser() ||
        ($post->getAuthor()?->getId() !== $this->getUser()->getId()
         && !in_array('ROLE_ADMIN', $this->getUser()->getRoles()))) {
        throw $this->createAccessDeniedException();
    }
}
```

### PASS: Voter 集中决策

```php
public function edit(Post $post): Response {
    $this->denyAccessUnlessGranted(PostVoter::EDIT, $post);
}
```

### FAIL: Voter 里产生副作用

```php
protected function voteOnAttribute(...): bool {
    $this->auditLogger->log(...);  // 写库
    $this->notifier->send(...);    // 发通知
    return $subject->canEdit($user);
}
```

### PASS: Voter 保持纯判断

```php
protected function voteOnAttribute(...): bool {
    return $subject->getAuthor()?->getId() === $user->getId();
}
// 副作用交给 AccessDeniedHttpException 的 EventSubscriber 统一处理
```
