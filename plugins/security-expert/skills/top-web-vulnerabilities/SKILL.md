---
name: top-web-vulnerabilities
description: "当需要快速识别、解释和归类常见 Web 安全漏洞，并给出根因与修复方向时使用。"
---

# 常见 Web 漏洞参考

## 适用场景
- 需要给发现的问题做统一分类、影响说明和修复建议。
- 需要为 [broken-authentication](../broken-authentication/SKILL.md)、[file-path-traversal](../file-path-traversal/SKILL.md)、[api-fuzzing-bug-bounty](../api-fuzzing-bug-bounty/SKILL.md) 提供公共术语。
- 需要把“现象”提升到“根因类别”。

## 核心约束
- 优先描述根因和利用条件，而不是只列 payload。
- 分类要服务于修复和沟通，不是为了凑术语。
- 同一问题可能跨多个类别，但主分类必须明确。
- 不把扫描器命名当标准分类。

## 代码模式
```markdown
| 类别 | 典型根因 | 常见影响 | 首选修复方向 |
| --- | --- | --- | --- |
| 访问控制缺陷 | 服务端未校验主体/客体关系 | 越权读写 | 在服务端强制鉴权 |
| 注入 | 不可信输入进入解释器上下文 | 数据泄露/执行 | 参数化与上下文转义 |
```

## 检查清单
- 问题是否明确对应根因、影响和修复建议。
- 是否区分认证、授权、输入处理、配置和业务逻辑。
- 是否说明利用条件与受影响边界。
- 是否避免把不同漏洞类别混成一个结论。

## 反模式

### FAIL: 贴标签式报告

```markdown
- 发现 SQL 注入（OWASP A03:2021）
- 发现 XSS（OWASP A07:2021）
- 建议修复
```

→ 没有根因、利用条件和受影响边界，读者无法判断严重程度和修复优先级。

### PASS: 根因驱动的分类报告

```markdown
- 类别：注入（A03:2021）
- 根因：`req.query.id` 直接拼入 SQL 字符串（src/db/users.js:47）
- 利用条件：无需认证，GET /api/users?id= 公开可访问
- 影响：攻击者可读取任意表数据，含用户密码哈希
- 修复：改用参数化查询 `db.query("SELECT * FROM users WHERE id = $1", [id])`
```

### FAIL: 只看 payload 不看服务端

```
测试：<script>alert(1)</script> → 页面弹窗 → 存在 XSS
```

→ 没有确认是存储型还是反射型，没有确认服务端是否转义。

### PASS: 追踪完整数据流

```
测试：POST /comment {body: "<img src=x onerror=alert(1)>"}
存储：数据库 comments 表原样存入（src/routes/comment.ts:31 无转义）
渲染：GET /post/123 → 模板 dangerouslySetInnerHTML（src/components/Post.tsx:45）
分类：存储型 XSS，影响所有访问该页面的用户
```
