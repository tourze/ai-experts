## 路由

| 触发信号 | 审计类型 |
|---------|---------|
| `innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write`/`eval(`/模板注入 | XSS 审计 |
| CORS/CSP/HSTS/`helmet`/安全头/Secure flag/`X-Frame-Options` | 安全头审计 |
| `package.json`/`Cargo.toml`/`go.mod`/`requirements.txt`/`Gemfile`/依赖声明 | 依赖风险审计 |

## XSS 审计

### 检查点

- **输出编码**：HTML 内容是否经过上下文感知的编码（HTML entity / JS string / URL / CSS）；是否使用框架内置的自动转义（React JSX、Vue `{{ }}`、Angular 模板）。
- **危险 API**：是否使用 `innerHTML`、`dangerouslySetInnerHTML`、`v-html`、`document.write`、`eval()`、`new Function()` 直接处理用户输入。
- **富文本场景**：是否使用 DOMPurify 等服务端/客户端 HTML 清洗库；是否配置了白名单标签和属性。
- **反射型 XSS**：URL 参数、hash、referer 是否被直接反射到页面 DOM 而不做编码。
- **存储型 XSS**：用户生成内容（评论、昵称、消息、文件描述）在输出时是否编码。
- **DOM XSS**：`location.hash`/`postMessage`/`localStorage` 是否直接传给 `innerHTML`/`eval`/`setTimeout(string)`。
- **CSP 强度**：是否设置了 `Content-Security-Policy`；是否避免 `unsafe-inline`/`unsafe-eval`；是否使用 nonce 或 hash 模式。

### 反模式

- 用简单的字符串替换 `<>` 替代上下文感知编码。
- `dangerouslySetInnerHTML` 的内容来源可被用户间接控制。
- CSP 中包含 `unsafe-inline` 且没有 nonce，等同于未设 CSP。
- 前端做 HTML 清洗但服务端不校验，攻击者可绕过前端直接 POST。

## 安全头审计

### 检查点

- **CORS**：`Access-Control-Allow-Origin` 是否为 `*` 或反射请求 Origin 而不做白名单校验；`Access-Control-Allow-Credentials: true` 是否与通配源同用。
- **CSP**：是否部署了 `Content-Security-Policy`；是否限制 `script-src`/`style-src`/`connect-src`；是否配置了 `report-uri` 或 `report-to` 用于违规监控。
- **HSTS**：是否设置了 `Strict-Transport-Security`；`max-age` 是否 ≥ 1 年；是否包含 `includeSubDomains`。
- **Cookie**：是否设置了 `Secure`/`httpOnly`/`SameSite`；`Domain` 属性是否过于宽松。
- **其他关键头**：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY` 或 `SAMEORIGIN`、`Referrer-Policy`、`Permissions-Policy`。
- **移除信息泄漏**：是否移除了 `Server`/`X-Powered-By`/`X-AspNet-Version` 等版本泄露头。

### 反模式

- `Access-Control-Allow-Origin: *` 与 `Access-Control-Allow-Credentials: true` 同时使用（浏览器会拒绝）。
- 只检查主域名的安全头，忽略子域名和 API 子域。
- 依赖默认配置而不显式设置安全头。

## 依赖风险审计

### 检查点

- **已知 CVE**：依赖是否在 NVD/GitHub Advisory/OSV 中有已知漏洞；是否有可用的修复版本。
- **版本过期**：直接依赖和间接依赖是否严重过期；主版本是否已 EOL。
- **间接依赖**：lockfile 是否提交到版本控制；间接依赖的 CVE 是否同样需要修复。
- **供应链风险**：是否依赖了低维护、单贡献者或无发布历史的包；是否有 typosquatting 风险。
- **许可证合规**：依赖的许可证是否与项目许可证兼容。

### 反模式

- 只看直接依赖的 CVE，忽略间接依赖（npm `overrides`、pip `constraints`、cargo `[patch]`）。
- lockfile 不进仓库，CI 每次安装最新版本，导致不可复现构建。
- 依赖审计工具只跑不读结果，或只读不修。

## 审计输出

每条发现绑定：文件:行 + 代码片段 + 攻击向量 + 可利用性评估（confirmed/likely/speculative）。

```markdown
## XSS 与安全配置审计结果

### XSS
| 位置 | 类型 | 严重度 | 编码策略 | 证据 |
|------|------|--------|---------|------|

### 安全头
| 头名称 | 当前值 | 问题 | 建议 |
|--------|--------|------|------|

### 依赖风险
| 包名 | 当前版本 | CVE/风险 | 修复版本 | 严重度 |
|------|---------|---------|---------|--------|
```
