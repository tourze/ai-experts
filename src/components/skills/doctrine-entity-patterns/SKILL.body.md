## 代码模式

见 [reference.md](reference.md)。

## 检查清单

- 列映射是否用 Attributes 且有 `comment`。
- 关联是否声明了 `mappedBy`/`inversedBy` 和 `cascade`。
- Repository 是否避免了 `findAll()` 和无界查询。
- Migration 是否可回滚、有索引和外键。
- 集合遍历是否用了 `JOIN FETCH` 或 `toIterable()` 防 N+1。

## 反模式

### FAIL: DateTime 可变日期

```php
#[ORM\Column(type: 'datetime')]
private \DateTime $createdAt; // 任何地方 ->modify() 都会改变已持久化对象
```

### PASS: DateTimeImmutable

```php
#[ORM\Column(type: 'datetime_immutable')]
private \DateTimeImmutable $createdAt;
```

### FAIL: 关联缺反向声明

```php
class Order {
    #[ORM\ManyToOne(targetEntity: User::class)]
    private User $user; // User 侧看不到 orders，无法 JOIN FETCH
}
```

### PASS: 双向声明 + cascade

```php
class User {
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Order::class)]
    private Collection $orders;
}
class Order {
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'orders')]
    private User $user;
}
```
