---
name: java-junit
description: 当需要编写或审查 JUnit 5 测试、参数化测试或 Mockito 隔离时使用。
---

# Java JUnit

## 适用场景

- 为 Java / Spring 代码补 JUnit 5 单元测试或重构现有测试。
- 需要参数化测试、异常断言、Mockito 隔离与测试命名规范。
- 想区分单元测试、切片测试和 `@SpringBootTest` 的使用边界。
- 如果测试对象本身来自服务层设计问题，可回看 [spring-boot-layering](../spring-boot-layering/SKILL.md)。

## 核心约束

- 一个测试只验证一个行为，遵循 AAA（Arrange / Act / Assert）。
- 单元测试优先：能不用 Spring 容器就不用，避免用 `@SpringBootTest` 包住纯业务类。
- 参数化测试优先覆盖边界和等价类，不要只拿它批量堆样例。
- 断言要指向业务结果，不要依赖日志输出或内部实现细节。
- Mock 只隔离协作者，不要把每一层都 mock 到测试失真。

## 代码模式

```java
class SlugServiceTest {
    private final SlugService service = new SlugService();

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.CsvSource({
        "'Hello World', 'hello-world'",
        "'Java 21', 'java-21'"
    })
    void toSlug_returns_expected_value(String input, String expected) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, service.toSlug(input));
    }
}
```

```java
@org.junit.jupiter.api.extension.ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class UserServiceTest {
    @org.mockito.Mock
    private UserRepository userRepository;

    @org.mockito.InjectMocks
    private UserService userService;

    @org.junit.jupiter.api.Test
    void findById_throws_when_user_missing() {
        org.mockito.Mockito.when(userRepository.findById(99L))
            .thenReturn(java.util.Optional.empty());

        org.junit.jupiter.api.Assertions.assertThrows(
            UserNotFoundException.class,
            () -> userService.findById(99L)
        );
    }
}
```

```java
@org.junit.jupiter.api.Test
void createUser_sets_all_fields() {
    UserDto result = service.create(new CreateUserRequest("Ada", "ada@example.com"));

    org.junit.jupiter.api.Assertions.assertAll(
        () -> org.junit.jupiter.api.Assertions.assertNotNull(result.id()),
        () -> org.junit.jupiter.api.Assertions.assertEquals("Ada", result.name()),
        () -> org.junit.jupiter.api.Assertions.assertEquals("ada@example.com", result.email())
    );
}
```

## 检查清单

- 测试命名是否能表达“方法 / 期望行为 / 场景”。
- 是否优先测试公共行为与边界值，而不是私有实现细节。
- 参数化测试是否覆盖空值、边界值、异常值和典型值。
- 是否正确使用 `assertThrows`、`assertAll`、Mockito 验证与测试数据工厂。
- 如果使用 Spring 测试切片，范围是否足够小，启动成本是否合理。

## 反模式

### FAIL: @SpringBootTest 测纯逻辑

```java
@SpringBootTest  // 启动整个 Spring 容器（5-15 秒）
class SlugServiceTest {
    @Autowired SlugService service;
    @Test void slugify() {
        assertEquals("hello-world", service.toSlug("Hello World"));
    }
}
// 启动 1000 次容器 → 整个 test suite 跑 30 分钟
```

### PASS: 纯单元测试

```java
class SlugServiceTest {
    private final SlugService service = new SlugService();  // new 即可
    @Test void slugify() {
        assertEquals("hello-world", service.toSlug("Hello World"));
    }
}
// 毫秒级，并行跑数千个无负担
```

### FAIL: Thread.sleep 等异步

```java
@Test void sendsNotification() {
    notifier.sendAsync(message);
    Thread.sleep(2000);  // 等 2 秒
    assertEquals(1, notifier.sentCount());
}
// 慢 / 不稳定 / 时序竞争
```

### PASS: Awaitility 显式等待

```java
@Test void sendsNotification() {
    notifier.sendAsync(message);
    Awaitility.await()
        .atMost(5, SECONDS)
        .until(() -> notifier.sentCount() == 1);
}
// 实际 50ms 完成 → 不等满 5 秒
```

### FAIL: 只验证 mock 调用

```java
@Test void createUser() {
    service.create(req);
    verify(repo).save(any());  // 只验证调用，不验证内容
}
// 即使 service 把 email 字段写丢了，测试仍通过
```

### PASS: ArgumentCaptor 验证内容

```java
@Test void createUser_persistsCorrectFields() {
    service.create(new CreateUserRequest("Ada", "ada@x.com"));

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(repo).save(captor.capture());
    assertEquals("ada@x.com", captor.getValue().getEmail());
}
```
