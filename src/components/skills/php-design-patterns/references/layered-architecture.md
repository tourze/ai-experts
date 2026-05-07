## 分层速查

| 层 | 职责 | 禁止 |
|----|------|------|
| Controller | 验证、鉴权、调服务、映射响应 | 业务逻辑、直接操作数据库 |
| Service | 业务流程编排、领域规则 | 访问 HTTP 请求、返回 HTTP 响应 |
| Repository | 数据访问、查询构建 | 业务规则 |
| DTO | 跨层数据传输、输入归一化 | 行为逻辑 |
| Value Object | 封装业务概念、自验证、不可变 | 可变状态 |

代码示例见 [patterns.md](references/patterns.md)。

## 代码模式

### 薄控制器 + Service

```php
public function __construct(private CreateUserService $service) {}
public function store(Request $r) {
    $dto = CreateUserDto::fromRequest($r->validated());
    $user = $this->service->execute($dto);
    return UserResource::make($user);
}
```

### 构造注入

```php
class OrderService {
    public function __construct(
        private CacheRepository $cache,
        private Mailer $mailer,
    ) {}
}
```

代码示例见 [patterns.md](references/patterns.md)。
