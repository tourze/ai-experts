---
name: symfony-voters
description: 设计和修复 Symfony 授权边界，覆盖 Voter、属性检查、控制器集成、默认拒绝与拒绝路径测试
---

# Symfony Voters

## 适用场景

- 需要新增、收敛或审查 Symfony Voter、`#[IsGranted]`、`denyAccessUnlessGranted()` 等授权逻辑。
- 权限判断散落在 Controller、Service、Twig 模板和仓储层，导致规则漂移。
- 需要把“谁能对什么资源执行什么动作”固化为明确的决策矩阵。
- 如果授权后的动作会投递异步消息，可联动 [symfony-messenger](../symfony-messenger/SKILL.md)；如果授权绑定 ORM 资源加载，可联动 [doctrine-batch-processing](../doctrine-batch-processing/SKILL.md)。
- 更细的验证命令见 [reference.md](reference.md)。

## 核心约束

- 默认拒绝：属性不支持、主体为空或资源类型错误时，必须明确走拒绝路径。
- 授权只回答“能不能做”，不要把完整业务流程塞进 Voter。
- 资源加载、授权判断、错误响应三层职责要分开，避免既查库又改状态。
- 不要通过错误消息泄露敏感上下文，例如“资源存在但你无权访问”这类差异。
- 控制器、API Platform、Twig 模板和命令入口必须复用同一套授权事实，而不是各写一份 if/else。

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

- 在 Controller 里手写一串角色判断，而不是沉淀到 Voter。
- `voteOnAttribute()` 里顺手改数据库状态、发消息或做远程调用。
- `supports()` 过宽，导致错误 subject 也进入授权逻辑，最后靠异常兜底。
- 一个动作在模板、Controller、Service 各写一份判断，结果互相矛盾。
- 用“返回 404 假装资源不存在”掩盖所有权限问题，却没有统一策略和测试。
