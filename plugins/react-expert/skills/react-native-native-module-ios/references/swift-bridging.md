# Swift 原生模块 + 桥接头文件

## Swift 实现

```swift
// ios/RNHapticsSwift.swift
import UIKit

@objc(RNHapticsHelper)
class RNHapticsHelper: NSObject {

    @objc
    static func triggerImpact(_ style: String) {
        let feedbackStyle: UIImpactFeedbackGenerator.FeedbackStyle
        switch style {
        case "heavy":   feedbackStyle = .heavy
        case "medium":  feedbackStyle = .medium
        default:        feedbackStyle = .light
        }
        let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
        generator.prepare()
        generator.impactOccurred()
    }

    @objc
    static func triggerNotification(_ type: String) {
        let feedbackType: UINotificationFeedbackGenerator.FeedbackType
        switch type {
        case "error":   feedbackType = .error
        case "warning": feedbackType = .warning
        default:        feedbackType = .success
        }
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(feedbackType)
    }

    @objc
    static func triggerSelection() {
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
    }
}
```

## Objective-C++ 壳

```objc
// ios/RNHapticsModule.h
#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <HapticsSpec/HapticsSpec.h>
#endif

@interface RNHapticsModule : NSObject <RCTBridgeModule
#ifdef RCT_NEW_ARCH_ENABLED
    , NativeHapticsSpec
#endif
>
@end
```

```objc
// ios/RNHapticsModule.mm
#import "RNHapticsModule.h"
#import "YourProject-Swift.h"  // Xcode 自动生成的桥接头文件

@implementation RNHapticsModule

RCT_EXPORT_MODULE(Haptics)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(impact:(NSString *)style
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [RNHapticsHelper triggerImpact:style];
        resolve(@YES);
    });
}

RCT_EXPORT_METHOD(notification:(NSString *)type
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [RNHapticsHelper triggerNotification:type];
        resolve(@YES);
    });
}

RCT_EXPORT_METHOD(selection:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [RNHapticsHelper triggerSelection];
        resolve(@YES);
    });
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeHapticsSpecJSI>(params);
}
#endif

@end
```

## 为什么需要 ObjC++ 壳

- `getTurboModule:` 返回 C++ 类型（`std::shared_ptr`），Swift 无法直接表达。
- 纯 Swift TurboModule 目前不受官方支持。
- 模式：Swift 实现业务逻辑 + ObjC++ 壳做 React Native 桥接和 JSI 绑定。

## 桥接头文件注意事项

- `YourProject-Swift.h` 由 Xcode 自动生成，命名为 `{产品模块名}-Swift.h`。
- 如果在 framework 中，使用 `#import <MyFramework/MyFramework-Swift.h>`。
- Swift 类必须继承 `NSObject` 且用 `@objc` 标记，否则在 ObjC++ 侧不可见。
