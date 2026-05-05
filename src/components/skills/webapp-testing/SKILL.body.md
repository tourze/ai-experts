## 代码模式

### 模式 1：基础导航与断言

```javascript
await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
```

### 模式 2：表单提交流程

```javascript
await page.getByLabel("Username").fill("tester");
await page.getByLabel("Password").fill("password123");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard");
```

### 模式 3：使用辅助函数

```javascript
const {
  waitForCondition,
  captureConsoleLogs,
  captureScreenshot,
} = require("./assets/test-helper.js");

const logs = captureConsoleLogs(page);
await waitForCondition(async () => (await page.locator("[data-ready='true']").count()) > 0);
await captureScreenshot(page, "dashboard-ready");
console.log(logs);
```

## 反模式

### FAIL: 易碎选择器

```js
await page.click('.btn-primary.btn-lg.mt-4');  // CSS 类组合
// 设计改样式 → 测试全挂
```

### PASS: 语义选择器

```js
await page.getByRole('button', { name: 'Sign in' }).click();
// 或 data-testid
await page.locator('[data-testid="login-submit"]').click();
```

### FAIL: 固定 sleep

```js
await page.click('submit');
await page.waitForTimeout(3000);  // 等 3 秒
await expect(...).toBeVisible();
```

### PASS: 显式等待

```js
await page.click('submit');
await page.waitForURL('**/dashboard');
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
// 1 秒就绪即继续，最多等 30s
```

### FAIL: 失败无证据

```js
try { await test(); } catch (e) { console.log(e); }
// CI 显示失败，没人知道在哪一步、页面状态如何
```

### PASS: 截图 + 日志

```js
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ path: `failures/${testInfo.title}.png` });
    console.log('Console:', await page.evaluate(() => console.history));
    console.log('URL:', page.url());
  }
});
```
