---
name: broken-authentication
description: "当需要测试认证与会话管理的安全性时使用。"
---

# 认证与会话缺陷测试

## 适用场景
- 需要验证登录、注册、找回密码、MFA、session、JWT 等认证链路。
- 需要与 [api-fuzzing-bug-bounty](../api-fuzzing-bug-bounty/SKILL.md) 联动验证 API 侧权限边界。
- 需要用 [top-web-vulnerabilities](../top-web-vulnerabilities/SKILL.md) 将问题归类并补齐修复建议。

## 核心约束
- 优先使用测试账号和受控密码字典，避免影响真实用户。
- 区分认证问题、授权问题和业务逻辑问题，不混报。
- 一切暴力/喷洒动作都必须先确认速率和锁定影响。
- 会话分析必须比较登录前后 token、超时、吊销和重放。

## 代码模式
```bash
# 登录基线
curl -i 'https://target.example/login' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'username=test&password=WrongPass123!'

# 会话固定验证时比对登录前后 Set-Cookie
curl -i 'https://target.example/logout'
```

## 检查清单
- 验证用户名枚举、密码策略、锁定、找回密码、MFA、session 吊销。
- 记录有效/无效账号在响应码、消息和时延上的差异。
- 检查 token 是否轮换、是否绑定设备/上下文。
- 对每个问题给出可复现步骤和真实影响。

## 反模式
- 只报“弱密码”而不说明策略与绕过路径。
- 把 401、403、404 的差异忽略掉。
- 未评估锁定影响就直接高频撞库。
