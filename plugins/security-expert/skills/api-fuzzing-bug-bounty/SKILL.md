---
name: api-fuzzing-bug-bounty
description: "当用户要对 REST、GraphQL 或移动端 API 做授权的安全测试、IDOR 检查、字段越权或参数篡改时使用。"
---

# API 安全模糊测试

## 适用场景
- 需要对 REST 或 GraphQL 接口做字段探测、越权测试、批量枚举和错误处理验证。
- 需要和 [broken-authentication](../broken-authentication/SKILL.md) 一起检查 token、session 与权限边界。
- 需要用 [top-web-vulnerabilities](../top-web-vulnerabilities/SKILL.md) 做漏洞分类和修复映射。

## 核心约束
- 仅限授权目标；生产环境默认只做只读或可回滚探测。
- 先保存基线请求，再一次只改一个变量，避免无法归因。
- 区分认证失败、授权失败、资源不存在与输入校验失败。
- 对速率、分页、批量接口和后台异步任务单独建模。

## 代码模式
```bash
# REST: 越权字段探测
curl -sS 'https://target.example/api/users/1001' \
  -H 'Authorization: Bearer TOKEN'

# GraphQL: 最小 introspection 验证
curl -sS 'https://target.example/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ __schema { queryType { name } } }"}'
```

## 检查清单
- 确认身份态、角色、租户边界和基线响应。
- 覆盖对象级、字段级、批量接口和异步接口。
- 记录所有成功越权的请求、响应和前置条件。
- 把可利用问题映射到具体修复点，而不是只报 payload。

## 反模式

### FAIL: 不区分 403 和 404

```
GET /api/users/1001 (自己的) → 200
GET /api/users/1002 (别人的) → 404
结论：无 IDOR
```

→ 404 可能是服务端故意伪装；应与 403 响应体、时延和 header 对比。

### PASS: 多维度交叉验证

```
GET /api/users/1002 (别人的) → 404 (12ms)
GET /api/users/9999 (不存在) → 404 (3ms)
结论：时延差异 9ms → 服务端先查了数据再返回 404 → 疑似 IDOR，需进一步确认
```

- 无基线就盲目跑字典或并发 fuzz。
- 在生产环境直接跑高并发破坏性 mutation。
