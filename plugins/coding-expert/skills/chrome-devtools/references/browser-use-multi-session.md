# 多浏览器会话

## 为什么要多会话

当你需要同时操作多个浏览器时：
- 一个 Cloud Browser 负责抓取，另一个本机 Chrome 负责登录态任务。
- 同时打开两个不同的 Chrome profile。
- 需要一个隔离浏览器做测试，避免污染用户当前浏览状态。
- 前台开一个 `--headed` 浏览器做调试，后台继续跑无头浏览器。

## 会话如何隔离

每个 `--session NAME` 都会拿到：
- Its own daemon process
- Its own Unix socket (`~/.browser-use/{name}.sock`)
- Its own PID file and state file
- Its own browser instance (completely independent)
- Its own tab ownership state (multi-agent locks don't cross sessions)

## `--session` 的使用规则

命中该会话的每条命令都要显式带上这个参数：

```bash
browser-use --session work open https://example.com
browser-use --session work state
browser-use state
```

如果漏掉 `--session`，命令就会回到 `default` 会话。这是最常见的误操作来源。

## 与不同浏览器模式组合使用

```bash
# 会话 1：Cloud Browser
browser-use --session cloud cloud connect

# 会话 2：连接用户现有 Chrome
browser-use --session chrome --connect open https://example.com

# 会话 3：前台可见 Chromium，用于调试
browser-use --session debug --headed open https://localhost:3000
```

三个会话互不影响：`cloud` 连远端浏览器，`chrome` 复用本机 Chrome，`debug` 管理独立 Chromium。

## 列出与管理会话

```bash
browser-use sessions
```

输出示例：
```
SESSION          PHASE          PID      CONFIG
cloud            running        12345    cloud
chrome           running        12346    cdp
debug            ready          12347    headed
```

`PHASE` 表示 daemon 生命周期状态：`initializing`、`ready`、`starting`、`running`、`shutting_down`、`stopped`、`failed`。

```bash
browser-use --session cloud close
browser-use close --all
```

## 常见模式

**Cloud 抓取 + 本机登录态：**
```bash
browser-use --session scraper cloud connect
browser-use --session scraper open https://example.com

browser-use --session auth --profile "Default" open https://github.com
browser-use --session auth state
```

**一次性测试浏览器：**
```bash
browser-use --session test --headed open https://localhost:3000
browser-use --session test close
```

**环境变量方式：**
```bash
export BROWSER_USE_SESSION=work
browser-use open https://example.com
```
