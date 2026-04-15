---
name: upgrading-react-native
description: 当用户要升级 React Native 或 Expo SDK 版本时使用。用户提到升级 RN、升级 Expo、rn-diff-purge、Upgrade Helper、0.x 到 0.y 时触发。
---

# 升级 React Native

## 适用场景

- 需要把 React Native 从一个 minor 版本升级到另一个 minor 版本。
- 需要同步 Expo SDK、React、CocoaPods、Gradle 或测试依赖。
- 需要评估 Upgrade Helper diff 对原生工程的影响。
- 升级后的性能与体验回归，可联动 [react-native-best-practices](../react-native-best-practices/SKILL.md)。
- 关键流程回归，可联动 [detox-mobile-test](../detox-mobile-test/SKILL.md)。

## 核心约束

- 目标版本必须先明确；不要一边升级一边猜最新版本。
- 升级流程以官方模板 diff 为准，做“合并”，不是“覆盖”本地原生改造。
- React、Expo、Testing Library、`react-test-renderer` 等配套依赖要一起审视。
- iOS 与 Android 都必须从干净构建验证；只过一端不算升级完成。
- 升级后必须留出时间处理 mocks、原生配置、构建脚本和 CI。

## 代码模式

```bash
# 1. 确认当前版本与目标版本
npm pkg get dependencies.react-native --prefix "$APP_DIR"
npm view react-native dist-tags.latest

# 2. 拉取 Upgrade Helper diff
curl -L -f -o /tmp/rn-diff.diff \
  "https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/0.76.9..0.78.2.diff"
grep -n "^diff --git" /tmp/rn-diff.diff

# 3. 更新依赖并安装
npm install --prefix "$APP_DIR"
cd "$APP_DIR/ios" && pod install

# 4. 双端构建验证
npx react-native build-android --mode debug --no-packager
xcodebuild -workspace "$APP_DIR/ios/App.xcworkspace" -scheme App -sdk iphonesimulator build
```

```md
按问题加载这些参考文件：

- [references/upgrading-react-native.md](references/upgrading-react-native.md)
- [references/upgrade-helper-core.md](references/upgrade-helper-core.md)
- [references/upgrading-dependencies.md](references/upgrading-dependencies.md)
- [references/react.md](references/react.md)
- [references/expo-sdk-upgrade.md](references/expo-sdk-upgrade.md)
- [references/upgrade-verification.md](references/upgrade-verification.md)
- [references/monorepo-singlerepo-targeting.md](references/monorepo-singlerepo-targeting.md)
```

## 检查清单

- [ ] 当前版本、目标版本和升级路径是否已经明确记录？
- [ ] Upgrade Helper diff 是否逐文件审阅并人工合并？
- [ ] React / Expo / testing 相关配套依赖是否同步对齐？
- [ ] iOS 与 Android 是否都从干净依赖、干净构建验证过？
- [ ] CI、原生脚本、mocks、lint/test 失败项是否已逐条处理？
- [ ] 升级后的关键业务流程是否完成回归？

## 反模式

- 直接把模板文件整份覆盖到现有原生工程。
- 只升级 `react-native`，不升级 React、Expo 或测试栈。
- Android 过了就合并，iOS 留着“后面再说”。
- 遇到构建失败就加临时补丁，不追根到真实破坏性变更。
- 不做业务回归，把“能编译”误当成“升级完成”。
