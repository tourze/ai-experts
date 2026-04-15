---
name: detox-mobile-test
description: 当用户要为 React Native 应用编写或排查 Detox E2E 测试时使用。用户提到 Detox、RN E2E、移动端自动化、CI 上的 E2E 不稳定时触发。
---

# Detox 移动端测试

## 适用场景

- React Native 项目需要覆盖登录、下单、支付、权限、深链等关键 E2E 流程。
- CI 上的 Detox 用例经常 flaky，需要收紧选择器和等待策略。
- 需要把本地运行、模拟器/模拟机配置与 CI 执行命令统一起来。
- 单元测试与组件测试任务更适合联动 [javascript-typescript-jest](../../../javascript-expert/skills/javascript-typescript-jest/SKILL.md)。

## 核心约束

- 选择器优先 `testID` / `by.id()`；`by.text()` 只能当补充，不做主定位手段。
- 禁止无条件 `sleep`；等待必须绑定可观察状态，用 `waitFor(...).toBeVisible()` 等显式同步。
- 每个测试独立可重跑，不依赖前一个用例留下的登录态或数据。
- CI 里优先跑 release 或接近生产的构建；debug 构建更容易放大时序噪音。
- 用例只断言用户可感知的行为，不把内部实现细节暴露为断言前提。

## 代码模式

```json
{
  "testRunner": {
    "args": {
      "$0": "jest",
      "config": "e2e/jest.config.js"
    },
    "jest": {
      "setupTimeout": 120000
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": { "type": "iPhone 15" }
    }
  },
  "apps": {
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/MyApp.app",
      "build": "xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    }
  },
  "configurations": {
    "ios.sim.debug": {
      "device": "simulator",
      "app": "ios.debug"
    }
  }
}
```

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

```javascript
// e2e/jest.config.js
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.js"],
  maxWorkers: 1,
  testTimeout: 120000,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
};
```

## 检查清单

- [ ] `.detoxrc.*` 中的 app/device/configuration 名称是否与 CI 命令一致？
- [ ] 关键元素是否都具备稳定 `testID`？
- [ ] 等待逻辑是否基于可见状态，而不是固定延时？
- [ ] 每条用例是否可独立运行，不依赖前置状态？
- [ ] 构建方式、模拟器/模拟机版本、Jest 配置是否已统一？
- [ ] 失败时是否能通过截图、日志、录像快速定位问题？

## 反模式

- 主要依赖 `by.text()`、层级路径或随机 index 定位元素。
- 大量使用 `setTimeout` / `sleep` 代替显式等待。
- 一个测试登录，后一个测试默认复用登录态。
- 只在本地 debug 包能跑通，CI / release 一跑就飘。
- 把 loading spinner、内部实现细节、日志文本当成核心断言。
