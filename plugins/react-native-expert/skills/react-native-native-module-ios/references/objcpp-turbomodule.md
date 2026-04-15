# 基础 Objective-C++ TurboModule

## 头文件

```objc
// ios/RNLocationModule.h
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <CoreLocation/CoreLocation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <LocationSpec/LocationSpec.h>
#endif

@interface RNLocationModule : RCTEventEmitter <
    RCTBridgeModule,
    CLLocationManagerDelegate
#ifdef RCT_NEW_ARCH_ENABLED
    , NativeLocationSpec
#endif
>
@end
```

## 实现文件

```objc
// ios/RNLocationModule.mm
#import "RNLocationModule.h"

@implementation RNLocationModule {
    CLLocationManager *_locationManager;
    RCTPromiseResolveBlock _pendingResolve;
    RCTPromiseRejectBlock _pendingReject;
}

RCT_EXPORT_MODULE(Location)

+ (BOOL)requiresMainQueueSetup {
    return YES; // CLLocationManager 需要主线程
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _locationManager = [[CLLocationManager alloc] init];
        _locationManager.delegate = self;
        _locationManager.desiredAccuracy = kCLLocationAccuracyBest;
    }
    return self;
}

// 同步方法
RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getAuthorizationStatus)
{
    CLAuthorizationStatus status = _locationManager.authorizationStatus;
    switch (status) {
        case kCLAuthorizationStatusAuthorizedAlways:
            return @"always";
        case kCLAuthorizationStatusAuthorizedWhenInUse:
            return @"whenInUse";
        case kCLAuthorizationStatusDenied:
            return @"denied";
        case kCLAuthorizationStatusRestricted:
            return @"restricted";
        default:
            return @"notDetermined";
    }
}

// 异步方法
RCT_EXPORT_METHOD(requestPermission:(NSString *)level
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    _pendingResolve = resolve;
    _pendingReject = reject;

    if ([level isEqualToString:@"always"]) {
        [_locationManager requestAlwaysAuthorization];
    } else {
        [_locationManager requestWhenInUseAuthorization];
    }
}

RCT_EXPORT_METHOD(getCurrentLocation:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    _pendingResolve = resolve;
    _pendingReject = reject;

    NSNumber *accuracy = options[@"accuracy"];
    if (accuracy) {
        _locationManager.desiredAccuracy = [accuracy doubleValue];
    }
    [_locationManager requestLocation];
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager
     didUpdateLocations:(NSArray<CLLocation *> *)locations
{
    CLLocation *loc = locations.lastObject;
    if (_pendingResolve) {
        _pendingResolve(@{
            @"latitude": @(loc.coordinate.latitude),
            @"longitude": @(loc.coordinate.longitude),
            @"altitude": @(loc.altitude),
            @"accuracy": @(loc.horizontalAccuracy),
            @"timestamp": @(loc.timestamp.timeIntervalSince1970 * 1000),
        });
        _pendingResolve = nil;
        _pendingReject = nil;
    }
}

- (void)locationManager:(CLLocationManager *)manager
       didFailWithError:(NSError *)error
{
    if (_pendingReject) {
        _pendingReject(@"LOCATION_ERROR", error.localizedDescription, error);
        _pendingResolve = nil;
        _pendingReject = nil;
    }
}

#pragma mark - RCTEventEmitter

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onLocationUpdate"];
}

#pragma mark - New Architecture

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeLocationSpecJSI>(params);
}
#endif

@end
```

## 关键点

- 文件扩展名必须是 `.mm`（Objective-C++）。
- `requiresMainQueueSetup` 返回 `YES` 让模块在主线程初始化，CLLocationManager 需要这个。
- `RCTPromiseResolveBlock` / `RCTPromiseRejectBlock` 只能调用一次，delegate 回调后置 nil。
- `RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD` 阻塞 JS 线程，仅用于极快操作。
