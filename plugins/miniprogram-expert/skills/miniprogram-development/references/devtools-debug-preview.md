# 微信开发者工具与预览参考

本文补充 `SKILL.md`，用于微信开发者工具调试、预览、上传，以及 `miniprogram-ci` 回退链路。

## 前置条件

- `project.config.json` 中必须有正确的 `miniprogramRoot` 和 `compileType`。
- 需要预览、上传、真机验证时，必须确认 `appid` 可用。
- 如果要走 `miniprogram-ci` 上传链路，还需要可用的小程序代码上传私钥。

## 开发者工具优先路径

优先推荐微信开发者工具，因为它直接覆盖以下能力：

- 编译与语法报错定位。
- 模拟器页面渲染与路由跳转。
- Network / Storage / AppData 面板排查。
- 预览二维码与真机联调。
- 上传体验版与版本管理。

排查顺序建议：

1. 先确认项目能在开发者工具内正常打开和编译。
2. 再检查 `app.json`、页面路径、分包配置和本地资源路径。
3. 最后再进入真机调试、预览或体验版上传。

## `miniprogram-ci` 回退链路

当本机无法使用开发者工具 GUI，或需要在 CI 中自动预览/上传时，再使用 `miniprogram-ci`。

安装依赖：

```bash
npm install --save-dev miniprogram-ci
```

基础上传脚本：

```js
const ci = require("miniprogram-ci");

const project = new ci.Project({
  appid: "your-mini-program-appid",
  type: "miniProgram",
  projectPath: "./",
  privateKeyPath: "./private.key",
  ignores: ["node_modules/**/*"],
});

async function main() {
  await ci.upload({
    project,
    version: "1.0.0",
    desc: "CI upload",
    setting: {
      es6: true,
      minify: true,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

基础预览脚本：

```js
const ci = require("miniprogram-ci");

const project = new ci.Project({
  appid: "your-mini-program-appid",
  type: "miniProgram",
  projectPath: "./",
  privateKeyPath: "./private.key",
  ignores: ["node_modules/**/*"],
});

async function main() {
  await ci.preview({
    project,
    desc: "CI preview",
    setting: {
      es6: true,
      minify: true,
    },
    qrcodeFormat: "image",
    qrcodeOutputDest: "./preview.jpg",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## 常见失败点

- `appid` 与上传私钥不匹配。
- `projectPath` 没有指向包含 `project.config.json` 的项目根目录。
- `miniprogramRoot` 指向错误，导致 CI 能启动但找不到页面或资源。
- 上传前未先执行依赖安装与 npm 构建，导致开发者工具与 CI 产物不一致。
- 把预览、上传问题误判成业务代码问题，实际上是账号权限或工具链配置问题。
