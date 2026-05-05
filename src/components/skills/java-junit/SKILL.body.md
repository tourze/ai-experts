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

assertAll 分组断言的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 反模式

- **@SpringBootTest 测纯逻辑** — 纯业务类直接 `new`，不启动容器。
- **Thread.sleep 等异步** — 用 Awaitility 显式等待替代固定睡眠。
- **只验证 mock 调用** — 用 `ArgumentCaptor` 验证传入内容，不要只 `verify(repo).save(any())`。

反模式 FAIL/PASS 对比代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。
