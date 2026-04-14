# CloudBase 小程序集成参考

本文补充 `SKILL.md`，用于需要落地 **微信小程序 + CloudBase** 的场景。

## 使用前提

- 只有在项目已经使用 `wx.cloud`、云函数、云数据库、云存储或腾讯云开发时，才应用本文规则。
- 如果只是普通小程序页面开发，不要提前引入 CloudBase 约束。

## 平台边界

- 微信小程序与 Web 的登录方式完全不同，不能复用 Web SDK 登录页或 Web OAuth 流。
- CloudBase 小程序天然依赖微信身份，不应额外生成用户名密码登录页。
- 服务端识别用户时，应在云函数中通过 `cloud.getWXContext().OPENID` 获取身份。

```js
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
  };
};
```

## 初始化模式

- `wx.cloud.init` 应在应用入口执行一次，避免页面级重复初始化。
- 能通过工具链获取环境 ID 时，优先复用工具链结果，不要拍脑袋硬编码环境名。
- 常规情况下保留 `traceUser: true`，便于 CloudBase 关联微信用户上下文。

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

## 能力边界

### 客户端适合做的事

- 使用 `wx.cloud.database()` 做用户可见、权限规则允许的读写。
- 使用 `wx.cloud.uploadFile()` 上传用户生成内容。
- 使用 `wx.cloud.callFunction()` 触发需要后端编排的能力。

### 云函数适合做的事

- 特权写入或跨集合写入。
- 第三方 API 调用。
- 事务、编排和数据规范化。
- 依赖可信身份的逻辑，例如基于 `OPENID` 的写入和鉴权。

## 工具链建议

- 优先使用 IDE 或现有 MCP 集成读取环境配置、部署状态和权限信息。
- IDE 集成不可用时，可使用 `mcporter` 调用 CloudBase MCP，不要把 Secret ID / Secret Key 写进仓库。

`config/mcporter.json`

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "description": "CloudBase MCP",
      "lifecycle": "keep-alive"
    }
  }
}
```

常用发现与认证命令：

```bash
npx mcporter list
npx mcporter describe cloudbase --all-parameters
npx mcporter call cloudbase.auth action=status --output json
npx mcporter call cloudbase.auth action=start_auth authMode=device --output json
npx mcporter call cloudbase.auth action=set_env envId=env-xxx --output json
```

## 结构检查

- 打开项目前先确认 `project.config.json` 中存在可用 `appid`。
- 小程序源码通常位于 `miniprogram/`，云函数通常位于 `cloudfunctions/`，但仍应以项目配置为准。
- 新增页面时，仍然要补齐页面级 `.json` 文件，不要只生成模板与逻辑文件。

## AI 能力接入

- 只有在基础库版本和环境能力满足时，才接入 `wx.cloud.extend.AI`。
- 涉及流式输出时，必须完整消费流，并将中间状态按 UI 能承受的频率回写页面。

## 常见误用

- 在小程序端直接套用 Web 登录流程。
- 在仓库里硬编码 CloudBase 私钥、环境密钥或管理员凭证。
- 把所有数据库写入都放在客户端完成，却没有先核对数据库权限规则。
- 在多个页面里重复调用 `wx.cloud.init`，导致初始化职责分散。
