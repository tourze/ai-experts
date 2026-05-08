
# 认证与会话缺陷测试

## 适用场景
- 需要验证登录、注册、找回密码、MFA、session、JWT 等认证链路。
- 需要与 [api-fuzzing-bug-bounty](./api-fuzzing-bug-bounty.md) 联动验证 API 侧权限边界。
- 需要用 [top-web-vulnerabilities](./top-web-vulnerabilities.md) 将问题归类并补齐修复建议。

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

### FAIL: 只报结论不给证据

```
发现：密码策略较弱
建议：加强密码策略
```

→ 没有说明当前策略是什么、最短长度、是否要求特殊字符、能否绕过。

### PASS: 给出具体策略和绕过路径

```
发现：密码最短 6 位，无复杂度要求（src/validators/auth.ts:23）
验证：注册接口接受 “aaaaaa” 作为密码，响应 201
影响：离线暴力破解 6 位纯小写仅需 ~3 亿次（GPU 秒级）
建议：最短 8 位 + 至少 1 数字 1 特殊字符，或接入 zxcvbn 强度评估
```

### FAIL: 忽略响应差异

```bash
# 有效用户名
POST /login {user: “admin”} → 401 “密码错误”
# 无效用户名
POST /login {user: “xxx”}  → 401 “密码错误”
# 结论：无用户名枚举
```

→ 只比较了消息文本，没检查响应时延和 header 差异。

### PASS: 多维度比对

```bash
# 有效用户名
POST /login {user: “admin”} → 401 “密码错误” 230ms X-Request-Id: abc
# 无效用户名
POST /login {user: “xxx”}  → 401 “密码错误” 12ms  X-Request-Id: def
# 结论：时延差异 218ms → 存在基于时间的用户名枚举
```
