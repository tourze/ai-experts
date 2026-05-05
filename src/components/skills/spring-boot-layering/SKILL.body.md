## 代码模式

```java
public record CreateUserRequest(
    @jakarta.validation.constraints.NotBlank String name,
    @jakarta.validation.constraints.Email String email
) {}
```

```java
@org.springframework.web.bind.annotation.RestController
@org.springframework.web.bind.annotation.RequestMapping("/api/users")
@lombok.RequiredArgsConstructor
class UserController {
    private final UserService userService;

    @org.springframework.web.bind.annotation.PostMapping
    org.springframework.http.ResponseEntity<UserDto> create(
        @org.springframework.web.bind.annotation.RequestBody
        @jakarta.validation.Valid
        CreateUserRequest request
    ) {
        UserDto created = userService.create(request);
        return org.springframework.http.ResponseEntity.status(201).body(created);
    }
}
```

```java
@org.springframework.stereotype.Service
@lombok.RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
class UserService {
    private final UserRepository userRepository;

    @org.springframework.transaction.annotation.Transactional
    UserDto create(CreateUserRequest request) {
        UserEntity entity = new UserEntity(request.name(), request.email());
        UserEntity saved = userRepository.save(entity);
        return new UserDto(saved.getId(), saved.getName(), saved.getEmail());
    }
}
```

```java
@org.springframework.data.jpa.repository.JpaRepository
interface UserRepository extends JpaRepository<UserEntity, Long> {
    java.util.Optional<UserEntity> findByEmail(String email);
}
```

## 检查清单

- 输入 DTO 是否经过校验，返回 DTO 是否与 Entity 隔离。
- Controller 是否只处理 HTTP 语义，没有直接依赖 Repository。
- 事务是否定义在 Service 层，且读写事务语义明确。
- JPA 查询是否考虑分页、N+1、索引命中与懒加载边界。
- 异常是否经由统一处理层输出稳定错误码和消息。
- 日志、指标、审计字段是否放在明确的可观测性边界，而不是业务代码里随手打印。

## 反模式

### FAIL: Entity 直接当 API 响应

```java
@GetMapping("/{id}")
UserEntity getUser(@PathVariable Long id) {
    return userRepository.findById(id).orElseThrow();
    // 暴露内部字段、懒加载代理、双向关联序列化炸裂
}
```

### PASS: DTO 隔离

```java
@GetMapping("/{id}")
UserDto getUser(@PathVariable Long id) {
    UserEntity entity = userRepository.findById(id).orElseThrow();
    return new UserDto(entity.getId(), entity.getName(), entity.getEmail());
}
```

### FAIL: Controller 直接访问 Repository

```java
@PostMapping
ResponseEntity<?> create(@RequestBody CreateUserRequest req) {
    // 业务逻辑散落在 Controller
    if (userRepository.findByEmail(req.email()).isPresent()) {
        return ResponseEntity.badRequest().body("email exists");
    }
    userRepository.save(new UserEntity(req.name(), req.email()));
    return ResponseEntity.ok().build();
}
```

### PASS: 业务逻辑收归 Service

```java
@PostMapping
ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
    UserDto created = userService.create(req); // 校验+持久化在 Service
    return ResponseEntity.status(201).body(created);
}
```
