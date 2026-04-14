# Symfony Voters 参考

本文件补充 `symfony-voters` 的典型实现、控制器集成和测试要点。

## Voter 示例

```php
<?php

namespace App\Security\Voter;

use App\Entity\Post;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class PostVoter extends Voter
{
    public const VIEW = 'POST_VIEW';
    public const EDIT = 'POST_EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return \in_array($attribute, [self::VIEW, self::EDIT], true) && $subject instanceof Post;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return match ($attribute) {
            self::VIEW => $subject->isPublished() || $subject->getAuthor()?->getId() === $user->getId(),
            self::EDIT => $subject->getAuthor()?->getId() === $user->getId(),
            default => false,
        };
    }
}
```

## 控制器集成

```php
<?php

use App\Entity\Post;
use App\Security\Voter\PostVoter;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/posts/{id}/edit', methods: ['GET', 'POST'])]
public function edit(Post $post): Response
{
    $this->denyAccessUnlessGranted(PostVoter::EDIT, $post);

    // 渲染表单或处理提交
}
```

## 模板集成

```twig
{% if is_granted(constant('App\\\\Security\\\\Voter\\\\PostVoter::EDIT'), post) %}
    <a href="{{ path('post_edit', {id: post.id}) }}">编辑</a>
{% endif %}
```

## 测试建议

- 匿名用户访问时返回拒绝。
- 资源所有者可以编辑，其他普通用户不可以。
- 管理员特判如果存在，要单独覆盖。
- `supports()` 不匹配时不应抛异常或进入错误逻辑。

## 验证命令

- `./vendor/bin/phpunit --filter=Voter`
- `php bin/console debug:container security`
- `php bin/console debug:config security`
- `./vendor/bin/phpstan analyse`

## 需要重点验证的失败模式

- 匿名用户被意外放行。
- `supports()` 过宽，错误 subject 被送入投票逻辑。
- 控制器、模板和 API 入口使用了不同属性名，导致权限漂移。
- 授权失败信息暴露了资源是否存在或其他敏感状态。
