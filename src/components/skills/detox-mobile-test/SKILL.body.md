## 代码模式

`.detoxrc` 配置和 Jest 配置的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

```javascript
// e2e/login.test.js
describe("Login Flow", () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("allows a valid user to sign in", async () => {
    await element(by.id("email-input")).replaceText("user@example.com");
    await element(by.id("password-input")).replaceText("password123");
    await element(by.id("login-submit")).tap();

    await waitFor(element(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```
