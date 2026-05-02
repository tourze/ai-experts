# iOS Objective-C++ 实现

## 头文件

```objc
// ios/DeviceInfoModule.h
#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <DeviceInfoSpec/DeviceInfoSpec.h>
#endif

@interface DeviceInfoModule : NSObject <RCTBridgeModule
#ifdef RCT_NEW_ARCH_ENABLED
    , NativeDeviceInfoSpec
#endif
>
@end
```

## 实现文件

```objc
// ios/DeviceInfoModule.mm（注意 .mm 扩展名）
#import "DeviceInfoModule.h"
#import <UIKit/UIKit.h>
#import <sys/utsname.h>

@implementation DeviceInfoModule

RCT_EXPORT_MODULE(DeviceInfo)

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getDeviceModel)
{
    struct utsname systemInfo;
    uname(&systemInfo);
    return [NSString stringWithCString:systemInfo.machine
                              encoding:NSUTF8StringEncoding];
}

RCT_EXPORT_METHOD(getBatteryLevel:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    float level = [UIDevice currentDevice].batteryLevel;
    if (level < 0) {
        reject(@"BATTERY_ERROR", @"Unable to read battery level", nil);
    } else {
        resolve(@(level * 100));
    }
}

RCT_EXPORT_METHOD(setConfig:(NSDictionary *)config
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    BOOL enableLogging = [config[@"enableLogging"] boolValue];
    NSInteger maxRetries = [config[@"maxRetries"] integerValue];
    NSArray *tags = config[@"tags"];
    // ... 业务逻辑
    resolve(@YES);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeDeviceInfoSpecJSI>(params);
}
#endif

@end
```

## 关键点

- 文件扩展名必须是 `.mm`（Objective-C++），`.m` 无法编译 C++ 代码。
- `getTurboModule:` 必须在 `#ifdef RCT_NEW_ARCH_ENABLED` 保护下。
- `NativeDeviceInfoSpecJSI` 由 Codegen 从 TypeScript Spec 自动生成。
- `RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD` 标记同步方法，会阻塞 JS 线程。
