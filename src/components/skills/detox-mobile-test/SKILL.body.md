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

## 反模式

### FAIL: by.text 当主选择器

```js
await element(by.text("登录")).tap();
// 文案改成"立即登录" → 测试全挂
// i18n 切到英文 → 测试全挂
```

### PASS: testID 优先

```jsx
<Button testID="login-submit">登录</Button>
```
```js
await element(by.id("login-submit")).tap();
```

### FAIL: sleep 等异步

```js
await element(by.id("login-submit")).tap();
await new Promise(r => setTimeout(r, 3000));  // 等 3 秒
await expect(element(by.id("home-screen"))).toBeVisible();
// CI 上慢机 3 秒不够 / 快机白等 2.5 秒
```

### PASS: waitFor 显式同步

```js
await element(by.id("login-submit")).tap();
await waitFor(element(by.id("home-screen")))
  .toBeVisible()
  .withTimeout(10000);
// 1 秒就绪即继续，超 10 秒才判失败
```

### FAIL: 测试间复用状态

```js
it("login", async () => { /* 完成登录 */ });
it("create order", async () => {
  // 假设上一个测试登录了 → 单独跑这个测试 → 失败
});
```

### PASS: 每测试独立

```js
beforeEach(async () => {
  await device.launchApp({ newInstance: true });
  await loginViaApi(testUser);  // 通过 API 准备状态，不依赖 UI 流
});
```
