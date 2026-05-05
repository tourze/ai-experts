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
