---
name: miniprogram-development
description: 当用户提到微信小程序、小程序页面、组件、project.config.json、appid、真机预览、miniprogram-ci、CloudBase 或 wx.cloud 时使用。
version: 2.15.5
alwaysApply: false
---

## 适用场景

- 需要创建、修改或排查微信小程序页面、组件、分包、路由和项目结构。
- 需要检查 `project.config.json`、`app.json`、页面级 `.json`、资源路径、`appid` 或构建配置。
- 需要规划开发者工具调试、预览、上传、真机验证或 `miniprogram-ci` 自动化链路。
- 代码或需求明确出现 `wx.cloud`、CloudBase、腾讯云开发、云函数、云数据库、云存储等关键词。
- 需要继续细化 CloudBase 集成时，先读 [CloudBase 集成参考](references/cloudbase-integration.md)。
- 需要继续细化调试、预览、上传流程时，先读 [开发者工具与预览参考](references/devtools-debug-preview.md)。

## 核心约束

- 默认按“普通微信小程序”处理，除非用户或代码明确表明项目正在使用 CloudBase。
- 小程序源码路径必须以 `project.config.json` 中的 `miniprogramRoot` 为准，不能凭目录名臆测。
- 页面级文件必须成套出现；新增页面至少要同步考虑 `.js/.ts`、`.wxml`、`.wxss`、`.json`。
- 只有在确认存在有效 `appid` 后，才给出预览、上传、真机调试或 CI 发布建议。
- CloudBase 项目禁止套用 Web 登录流；用户身份应由微信侧上下文或云函数 `OPENID` 获取。
- 本技能只处理小程序端开发与发布路径；纯 Web 前端、通用后端服务、单纯视觉设计不在当前技能范围内。

## 代码模式

### 1. 先校验项目入口和根目录

- 先读 `project.config.json`，确认 `appid`、`miniprogramRoot`、`compileType`。
- 如果页面或资源路径异常，先验证是否落在 `miniprogramRoot` 下，再判断代码是否有误。

`project.config.json`

```json
{
  "appid": "your-mini-program-appid",
  "projectname": "mini-program-demo",
  "miniprogramRoot": "./miniprogram",
  "compileType": "miniprogram"
}
```

### 2. 新增页面时保持“四件套”齐全

- 页面逻辑文件只放数据与事件。
- `.wxml` 负责模板结构。
- `.wxss` 负责页面样式。
- `.json` 负责页面级配置，例如标题和组件声明。

`miniprogram/pages/index/index.js`

```js
Page({
  data: {
    message: "Hello Mini Program",
  },
});
```

`miniprogram/pages/index/index.wxml`

```xml
<view class="page">
  <text>{{message}}</text>
</view>
```

`miniprogram/pages/index/index.json`

```json
{
  "navigationBarTitleText": "首页"
}
```

### 3. CloudBase 只在确认使用时启用

- 看到 `wx.cloud.init`、云函数目录、云数据库调用，再进入 CloudBase 约束。
- CloudBase 初始化应放在 `App.onLaunch` 或等价应用入口，不要在每个页面重复初始化。

`app.js`

```js
App({
  onLaunch() {
    wx.cloud.init({
      env: "your-env-id",
      traceUser: true,
    });
  },
});
```

### 4. 调试与发布按能力选择链路

- 优先走微信开发者工具：模拟器、编译错误、网络/存储面板、预览二维码、真机调试。
- 无法使用开发者工具时，再切换到 `miniprogram-ci` 做 npm 构建、预览或上传。
- 需要具体命令、前置条件和常见失败点时，转到 [开发者工具与预览参考](references/devtools-debug-preview.md)。

## 检查清单

- `project.config.json` 是否存在且 `miniprogramRoot`、`compileType`、`appid` 合法。
- 新增或修改的页面是否同步覆盖 `.js/.ts`、`.wxml`、`.wxss`、`.json`。
- 页面或组件引用的本地资源是否真实存在，路径是否相对 `miniprogramRoot` 正确。
- 如果使用 Taro，是否误用了 `document`、`window`、`react-dom` 等 DOM-only API。
- 如果使用 CloudBase，是否使用了 `wx.cloud` 客户端 API、云函数和 `OPENID` 正确边界。
- 涉及调试、预览、上传时，是否明确了开发者工具链路、CI 链路以及 `appid`/私钥前置条件。

## 反模式

### FAIL: 默认套 CloudBase / 用 DOM

```js
wx.cloud.callFunction('login')  // 项目可能没用 CloudBase
window.alert("xxx")              // 小程序无 window
```

### PASS: 先看 project.config.json + 小程序 API

```js
// 确认 wx.cloud.init 才走 CloudBase
wx.showModal({ title: "提示", content: "xxx" })
```

### FAIL: 缺页面四件套

```
仅创建 pages/profile/profile.js
→ 缺 .wxml/.json/.wxss
```

### PASS: 四件套 + app.json 同步

```
profile.{js, wxml, wxss, json}
+ app.json pages 数组追加
```
