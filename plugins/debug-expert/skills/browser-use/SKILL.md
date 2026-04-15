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

- 继续使用 `browser-use connect`、`browser-use config ...`、`cloud signup` 这类已和当前 CLI 不一致的旧命令。
- 页面刚导航或局部刷新后仍复用旧 `state` 索引，导致点错元素或把值写进错误输入框。
- 需要控制台 / 网络 / 性能证据时还硬用 CLI 交互，而不是切到 [chrome-devtools](../chrome-devtools/SKILL.md)。
- 混用多个会话却忘记 `--session`，结果把动作打到 `default` 浏览器。
- 把 `extract` 当成稳定能力，或在会话异常后只反复重试而不先 `close` 清理。
