# Detox 配置模式

本文件是 detox-mobile-test SKILL.md 的拆分内容，包含 `.detoxrc` 配置和 Jest 配置的完整代码。

## .detoxrc 配置示例

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

## Jest 配置示例

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
