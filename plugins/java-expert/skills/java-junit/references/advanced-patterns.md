# JUnit 5 进阶模式与反模式

本文件是 java-junit SKILL.md 的拆分内容，包含 assertAll 分组断言、反模式对比代码的完整示例。

## assertAll 分组断言

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
