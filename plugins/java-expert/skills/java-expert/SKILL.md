---
name: java-expert
description: Java 21+ 与 Spring Boot 3.x 开发和审查，覆盖 REST API、JPA、事务与微服务边界
---

# Java Expert

## 适用场景

- 新建或重构 Java 21+ / Spring Boot 3.x 服务。
- 审查 REST API、事务边界、JPA 映射、异常处理与可观测性。
- 需要对接测试、原生镜像或构建优化时，联动：
  [java-junit](../java-junit/SKILL.md)、
  [graalvm-native-image](../graalvm-native-image/SKILL.md)、
  [gradle-build-performance](../gradle-build-performance/SKILL.md)。
- 诊断线上 JVM / Spring 运行时问题时，联动：
  [arthas-cpu-high](../arthas-cpu-high/SKILL.md)、
  [arthas-springcontext-issues-resolve](../arthas-springcontext-issues-resolve/SKILL.md)。

## 核心约束

- 基线优先：默认使用 Java 21、Spring Boot 3.x、`jakarta.*` 命名空间。
- 分层必须清晰：Controller 只做协议转换，Service 承担业务与事务，Repository 只做持久化。
- API 合同与持久化模型分离：不要把 JPA Entity 直接暴露为请求或响应。
- 事务边界必须显式：读操作 `@Transactional(readOnly = true)`，写操作在服务层显式开启事务。
- 错误处理统一出口：使用 `@RestControllerAdvice` 或等价机制，不要在 Controller 散落 `try/catch`。

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

- Controller 直接访问 Repository，导致业务逻辑分散在协议层。
- 直接把 JPA Entity 作为 API 响应，暴露懒加载和字段漂移风险。
- 用 `catch (Exception)` 吞掉真实错误，再返回模糊成功或通用失败。
- 在实体或服务里遗留 `System.out.println`、`printStackTrace()` 之类调试输出。
- 依赖默认事务或 Open Session in View 掩盖设计问题。
