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
