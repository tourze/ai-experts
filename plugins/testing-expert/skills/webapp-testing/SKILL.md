---
name: webapp-testing
description: 当需要在真实浏览器中验证本地或可访问 Web 应用时使用。适用于“帮我点一下页面”“验证表单流程”“抓浏览器日志”“截图定位问题”“用 Playwright 测这个页面”等请求。
---

# Web 应用测试

## 适用场景

- 本地开发站点或测试环境页面需要真实浏览器验证。
- 需要验证交互、表单、跳转、控制台日志、截图或响应式表现。
- 需要把 [testing-strategy](../testing-strategy/SKILL.md) 里的 Web 场景落成实际浏览器检查。
- 需要在执行失败时保留证据用于复盘。

## 核心约束

- 优先使用 Playwright 能力；如果环境不支持，再退回本地 Node + Playwright。
- 开始前先确认目标地址可访问，不要盲点。
- 选择器优先级：`data-testid` / `role` / 可访问名称，高于脆弱 CSS 选择器。
- 关键步骤后要显式等待，不靠裸 `sleep`。
- 失败时截图并记录浏览器控制台日志。
- 结束后关闭浏览器上下文，避免遗留进程。
- 插件内可复用辅助函数：[test-helper.js](./assets/test-helper.js)

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

## 检查清单

- [ ] 已确认目标地址可访问
- [ ] 关键断言使用稳定选择器
- [ ] 关键步骤后有显式等待
- [ ] 失败时会截图或保留日志
- [ ] 测试结束关闭浏览器资源
- [ ] 没用固定 `sleep` 掩盖同步问题

## 反模式

- 页面还没 ready 就开始点击。
- 只用 `.class-name` 这种易碎选择器。
- 整个流程靠 `wait(3000)` 撑住。
- 失败后没有任何截图、日志或 URL 证据。
