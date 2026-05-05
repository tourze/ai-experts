# Java JUnit

> 通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 [testing-patterns](testing-expert:testing-patterns)。本 skill 只覆盖 Java 特有语法与工具。

## 适用场景

- 为 Java / Spring 代码补 JUnit 5 单元测试或重构现有测试。
- 需要参数化测试、异常断言、Mockito 隔离与测试命名规范。
- 想区分单元测试、切片测试和 `@SpringBootTest` 的使用边界。
- 如果测试对象本身来自服务层设计问题，可回看 [spring-boot-layering](../spring-boot-layering/SKILL.md)。

## 核心约束

- 单元测试优先：能不用 Spring 容器就不用，避免用 `@SpringBootTest` 包住纯业务类。
- 参数化测试不要只拿它批量堆样例，每个参数组合的意义要可从命名理解。
- Mockito 只隔离协作者，不要把每一层都 mock 到测试失真。

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

## 检查清单

- 是否正确使用 `assertThrows`、`assertAll`、Mockito 验证与测试数据工厂。
- 如果使用 Spring 测试切片，范围是否足够小，启动成本是否合理。

## 反模式

- **@SpringBootTest 测纯逻辑** — 纯业务类直接 `new`，不启动容器。
- **Thread.sleep 等异步** — 用 Awaitility 显式等待替代固定睡眠。
- **只验证 mock 调用** — 用 `ArgumentCaptor` 验证传入内容，不要只 `verify(repo).save(any())`。

反模式 FAIL/PASS 对比代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。
