# CocoaPods podspec 配置

## 完整 podspec

```ruby
# react-native-location.podspec
require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-location"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.author       = package["author"]
  s.source       = { :git => package["repository"]["url"], :tag => s.version }

  s.platforms    = { :ios => "15.1" }
  s.swift_version = "5.9"

  s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"

  # 关键：安装 Codegen 生成的依赖
  install_modules_dependencies(s)

  # 框架依赖
  s.frameworks = "CoreLocation"

  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => [
      "$(PODS_ROOT)/Headers/Public",
      "$(PODS_ROOT)/Headers/Public/React-Codegen",
    ].join(" "),
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
  }
end
```

## Podfile 引用

```ruby
# 本地开发
pod 'react-native-location', :path => '../node_modules/react-native-location'

# 或自动链接（RN 0.76+ 默认行为）
# 无需手动添加，autolinking 会处理
```

## install_modules_dependencies 做了什么

这个辅助函数由 React Native 提供，自动添加：
- `React-Core` 依赖
- `React-Codegen` 依赖（New Architecture）
- `React-RCTFabric` 依赖（Fabric 渲染器）
- 正确的编译器标志和头文件搜索路径

## 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| `install_modules_dependencies` 找不到 | React Native 版本过旧 | 升级到 0.72+，或手动声明依赖 |
| Codegen 头文件找不到 | `HEADER_SEARCH_PATHS` 缺失 | 添加 `$(PODS_ROOT)/Headers/Public` |
| Swift 编译报错 | `swift_version` 未声明 | 添加 `s.swift_version = "5.9"` |
| `.mm` 文件编译失败 | C++ 标准不对 | 设置 `CLANG_CXX_LANGUAGE_STANDARD` 为 `c++20` |

## 含 Swift 的 source_files

```ruby
# 必须包含 .swift
s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"
```

遗漏 `.swift` 会导致 Swift 文件不被编译，ObjC++ 壳导入桥接头文件时报 "class not found"。
