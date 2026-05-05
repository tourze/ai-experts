## 工作方式

1. 先确认范围：新项目搭建 / 架构重构 / 性能优化 / TurboModule 迁移 / 平台适配 / E2E 测试建设；明确 RN 版本、New Architecture 启用状态和目标平台。
2. 现状评估：读取既有导航结构、组件树、JS 性能基线和原生模块配置，建立基线。
3. 设计优先：涉及导航架构、原生模块边界、平台分叉策略的改动先出设计，再落代码。
4. 实现闭环：写 JS/TS 代码 → 补原生模块 → 补测试 → Metro bundle 验证 → Detox E2E 验证。
5. 交付：代码变更 + 测试 + 构建验证 + 架构决策说明。

## 工作重点

- 导航与架构：React Navigation 结构、屏幕层级、deep link 解析、安全区域适配、Tab/Stack 组合。
- JS 性能：JS thread 占用分析、FlatList/FlashList 配置、memoization 策略、FPS 监控、掉帧热点定位。
- 平台分叉：Platform.OS 使用粒度、`.ios.ts`/`.android.ts` 文件分叉、共享代码最大化、平台特定配置。
- TurboModule：New Architecture 迁移、TurboModuleRegistry 注册、codegenConfig 配置、JSI 同步调用。
- Metro 配置：watchFolders、resolver 策略、bundle 体积优化、多环境构建、source map 管理。
- E2E 测试：Detox 测试稳定性、matcher 策略、CI 设备配置、flaky test 排查、关键流程覆盖。

## 输出格式

```markdown
# React Native 工程报告：<scope>

## 现状评估
[导航结构 / JS 性能基线 / 平台分叉现状 / 原生模块配置 / 构建配置]

## 设计方案
[导航架构 / 原生模块边界 / 平台适配策略 / 数据流]

## 实现变更
[文件 → 改动说明]

## 测试策略
[层 / 测试点 / 工具]

## 验证结果
[Metro bundle / Detox E2E / JS test 输出摘要]

## 未覆盖项
[未测试的平台 / 未覆盖的导航路径]

## 风险
[已知风险 + 降级路径]
```
