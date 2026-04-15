# getTurboModule 实现详解

## 最小模板

```objc
// 头文件
#ifdef RCT_NEW_ARCH_ENABLED
#import <MyModuleSpec/MyModuleSpec.h>
#endif

@interface MyModule : NSObject <RCTBridgeModule
#ifdef RCT_NEW_ARCH_ENABLED
    , NativeMyModuleSpec
#endif
>
@end
```

```objc
// .mm 实现文件
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeMyModuleSpecJSI>(params);
}
#endif
```

## 必须的头文件导入

```objc
// .mm 文件顶部
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTTurboModule.h>       // TurboModule 基础设施
#import <MyModuleSpec/MyModuleSpec.h>   // Codegen 生成
#endif
```

## 命名规则

| Spec 文件名 | 生成的协议 | 生成的 JSI 类 |
|---|---|---|
| `NativeMyModule.ts` | `NativeMyModuleSpec` | `NativeMyModuleSpecJSI` |
| `NativeDeviceInfo.ts` | `NativeDeviceInfoSpec` | `NativeDeviceInfoSpecJSI` |
| `NativeClipboard.ts` | `NativeClipboardSpec` | `NativeClipboardSpecJSI` |

头文件 import 路径格式：`<{codegenConfig.name}/{codegenConfig.name}.h>`

## 常见错误

| 错误信息 | 原因 | 解决 |
|---|---|---|
| `Use of undeclared identifier 'std'` | 文件是 `.m` 而非 `.mm` | 重命名为 `.mm` |
| `'MyModuleSpec/MyModuleSpec.h' file not found` | Codegen 未运行或 podspec 缺依赖 | 运行 `pod install` 并确认 `install_modules_dependencies(s)` |
| `No type named 'TurboModule' in namespace` | 缺少 `#import <React/RCTTurboModule.h>` | 添加该头文件导入 |
| 旧架构编译报错 | 缺少 `#ifdef RCT_NEW_ARCH_ENABLED` | 用 ifdef 保护所有 TurboModule 代码 |
