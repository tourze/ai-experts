---
name: browser-use
description: 当需要通过真实浏览器自动化验证网页或提取页面数据时使用。
allowed-tools: Bash(browser-use:*)
---

# Browser Use

## 适用场景

- 需要快速打开网页、查看可点击元素、填写表单、截图或提取页面文本/HTML。
- 需要复用本机 Chrome 登录态、通过 Cloud Browser 访问目标环境，或并行跑多个浏览器会话。
- 当前重点是网络、控制台、性能 trace 或 Lighthouse 证据时，切换到 [chrome-devtools](../chrome-devtools/SKILL.md)。
- 如果问题是桌面应用卡死、线程互锁或高 CPU，而不是网页自动化，切换到 [debug-lldb](../debug-lldb/SKILL.md)。

## 核心约束

- 先运行 `browser-use doctor` 检查 CLI、Chromium 与本地配置是否可用。
- 永远先执行 `browser-use state` 获取当前元素索引；导航或 DOM 变化后旧索引会失效。
- 连接现有 Chrome 的正确写法是 `browser-use --connect open <url>` 或 `browser-use --profile "Default" open <url>`，不要再使用旧的 `browser-use connect` 子命令。
- `--session NAME` 必须在命中该会话的每条命令上重复携带；漏掉时会自动落回 `default` 会话。
- `cloud connect` 依赖 API key；`extract` 仍未实现，不要把它当成稳定能力。
- 命令卡住或状态异常时，先 `browser-use close` 清掉当前会话后再重试。

## 代码模式

```bash
browser-use doctor
browser-use open https://example.com
browser-use state
browser-use input 3 "john@example.com"
browser-use click 5
browser-use screenshot /tmp/example.png
```

```bash
browser-use --connect open https://example.com
browser-use state
browser-use --profile "Default" open https://github.com
```

```bash
browser-use --session scrape cloud connect
browser-use --session scrape open https://example.com
browser-use --session auth --profile "Default" open https://github.com
browser-use sessions
browser-use --session scrape close
```

```bash
browser-use cloud login sk-example
browser-use cloud connect
browser-use cloud v2 GET /browsers
browser-use close
```

- 更深的 CDP 控制、设备模拟和目标页签激活，见 [references/cdp-python.md](references/cdp-python.md)。
- 多会话隔离模型和常见误操作，见 [references/multi-session.md](references/multi-session.md)。
- 官方 CLI 基线命令参见：<https://github.com/browser-use/browser-use/blob/main/browser_use/skill_cli/README.md>

## 检查清单

- 是否先运行 `doctor` 或至少确认 `browser-use` 已正确安装。
- 是否在交互前重新执行 `state` 获取最新索引，而不是复用旧编号。
- 是否根据场景正确选择默认无头浏览器、`--connect`、`--profile` 或 `cloud connect`。
- 是否在多浏览器场景里对每条命令都补齐同一个 `--session`。
- 是否在任务结束后执行 `browser-use close` 或 `close --all` 清理残留会话 / tunnel。

## 反模式

### FAIL: 旧 state 复用

```bash
browser-use state    # 拿到索引
browser-use click 5
# 页面跳转
browser-use click 5  # 仍用旧索引 → 点错位置
```

### PASS: 每次交互前 state

```bash
browser-use state    # 拿当前
browser-use click 5
browser-use state    # 重新获取（DOM 变了）
browser-use input 3 "..."
```

### FAIL: 多会话漏 --session

```bash
browser-use --session scrape open https://a.com
browser-use click 5  # 漏 --session → 打到 default 浏览器
```

### PASS: 每条都带 --session

```bash
browser-use --session scrape open https://a.com
browser-use --session scrape state
browser-use --session scrape click 5
browser-use --session scrape close
```
