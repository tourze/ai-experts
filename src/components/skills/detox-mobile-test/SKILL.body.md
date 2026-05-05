## 适用场景

- React Native 项目需要覆盖登录、下单、支付、权限、深链等关键 E2E 流程。
- CI 上的 Detox 用例经常 flaky，需要收紧选择器和等待策略。
- 需要把本地运行、模拟器/模拟机配置与 CI 执行命令统一起来。
- 单元测试与组件测试任务更适合联动 `javascript-typescript-jest`。

## 核心约束

- 选择器优先 `testID` / `by.id()`；`by.text()` 只能当补充，不做主定位手段。
- 禁止无条件 `sleep`；等待必须绑定可观察状态，用 `waitFor(...).toBeVisible()` 等显式同步。
- 每个测试独立可重跑，不依赖前一个用例留下的登录态或数据。
- CI 里优先跑 release 或接近生产的构建；debug 构建更容易放大时序噪音。
- 用例只断言用户可感知的行为，不把内部实现细节暴露为断言前提。

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

## 检查清单

- [ ] `.detoxrc.*` 中的 app/device/configuration 名称是否与 CI 命令一致？
- [ ] 关键元素是否都具备稳定 `testID`？
- [ ] 等待逻辑是否基于可见状态，而不是固定延时？
- [ ] 每条用例是否可独立运行，不依赖前置状态？
- [ ] 构建方式、模拟器/模拟机版本、Jest 配置是否已统一？
- [ ] 失败时是否能通过截图、日志、录像快速定位问题？

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
