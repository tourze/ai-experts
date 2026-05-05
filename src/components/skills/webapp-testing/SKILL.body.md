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
