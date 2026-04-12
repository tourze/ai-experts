# Symfony 模式

## 依赖注入

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\UserRepositoryInterface;
use Psr\Log\LoggerInterface;

final readonly class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private LoggerInterface $logger,
    ) {}

    public function createUser(string $email, string $password): User
    {
        $user = new User($email, password_hash($password, PASSWORD_ARGON2ID));
        $this->userRepository->save($user);
        $this->logger->info('User created', ['email' => $email]);
        return $user;
    }
}
```

## 带属性的控制器

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\DTO\CreateUserRequest;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users', name: 'api_users_')]
final class UserController extends AbstractController
{
    public function __construct(private readonly UserService $userService) {}

    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        return $this->json($this->userService->getAllUsers(), Response::HTTP_OK, [], [
            'groups' => ['user:read'],
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(#[MapRequestPayload] CreateUserRequest $request): JsonResponse
    {
        $user = $this->userService->createUser($request->email, $request->password);
        return $this->json($user, Response::HTTP_CREATED, [], ['groups' => ['user:read']]);
    }
}
```

## 带验证的 DTO

```php
<?php

declare(strict_types=1);

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateUserRequest
{
    public function __construct(
        #[Assert\NotBlank] #[Assert\Email]
        public string $email,
        #[Assert\NotBlank] #[Assert\Length(min: 8, max: 100)]
        public string $password,
        #[Assert\NotBlank] #[Assert\Length(min: 2, max: 100)]
        public string $name,
        #[Assert\Choice(choices: ['admin', 'user', 'moderator'])]
        public string $role = 'user',
    ) {}
}
```

## 投票器（授权）

```php
<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Post;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class PostVoter extends Voter
{
    public const VIEW = 'view';
    public const EDIT = 'edit';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT]) && $subject instanceof Post;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) { return false; }
        return match ($attribute) {
            self::VIEW => $subject->isPublished() || $subject->getAuthor()->getId() === $user->getId(),
            self::EDIT => $subject->getAuthor()->getId() === $user->getId(),
            default => false,
        };
    }
}
```

## 消息处理器（Messenger）

```php
<?php

declare(strict_types=1);

namespace App\Message;

final readonly class SendWelcomeEmail
{
    public function __construct(public int $userId) {}
}

namespace App\MessageHandler;

use App\Message\SendWelcomeEmail;
use App\Repository\UserRepositoryInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class SendWelcomeEmailHandler
{
    public function __construct(private UserRepositoryInterface $userRepository) {}

    public function __invoke(SendWelcomeEmail $message): void
    {
        $user = $this->userRepository->find($message->userId);
        if (!$user) { return; }
        // 发送邮件逻辑
    }
}
```

## 快速参考

| 组件 | 用途 | 文件位置 |
|------|------|----------|
| Controller | HTTP 处理器 | `src/Controller/` |
| Service | 业务逻辑 | `src/Service/` |
| Repository | 数据访问 | `src/Repository/` |
| Event | 领域事件 | `src/Event/` |
| Command | CLI 命令 | `src/Command/` |
| Voter | 授权 | `src/Security/Voter/` |
| Message | 异步消息 | `src/Message/` |
| DTO | 数据传输 | `src/DTO/` |
