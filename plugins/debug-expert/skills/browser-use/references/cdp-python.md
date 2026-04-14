# 原始 CDP 与 Python 会话参考

CLI 已经覆盖大多数网页操作；只有当你需要 CLI 没暴露的浏览器级控制时，才切到 `browser-use python` + 原始 CDP，例如激活真实可见页签、拦截网络请求、设备模拟，或直接处理 Chrome target ID。

## Python 会话如何工作

`browser-use python "statement"` 每次执行一条 Python 语句。变量会跨调用持久化，所以可以在前一次调用里赋值、后一次调用里继续使用。

CLI 会预注入一个 `browser` 对象，里面有常见同步包装（如 `browser.goto()`、`browser.click()`）。如果这些还不够，再使用下面两个内部入口：

- `browser._run(coroutine)` — run any async coroutine synchronously (60s timeout)
- `browser._session` — the raw `BrowserSession` with full CDP client access

## 获取 CDP client

```bash
browser-use python "cdp = browser._run(browser._session.get_or_create_cdp_session())"
```

执行后，`cdp` 会在后续调用里继续存在。发送任意 CDP 命令时使用 `cdp.cdp_client.send.<Domain>.<method>()`，需要 session 参数时使用 `cdp.session_id`。

## 常用模式

### 激活真实可见页签

`tab switch` 只会切换 agent 的内部焦点，不会改变用户眼前看到的 Chrome 可见页签。若要真的让用户看到某个标签页：

```bash
# 先拿到所有 target，找出目标 target ID
browser-use python "targets = browser._session.session_manager.get_all_page_targets()"
browser-use python "print([(i, t.url) for i, t in enumerate(targets)])"

# 激活 index=1 的 target，让它出现在用户界面里
browser-use python "cdp = browser._run(browser._session.get_or_create_cdp_session(target_id=None, focus=False))"
browser-use python "browser._run(cdp.cdp_client.send.Target.activateTarget(params={'targetId': targets[1].target_id}))"
```

### 列出带 target ID 的所有页签

```bash
browser-use python "targets = browser._session.session_manager.get_all_page_targets()"
browser-use python "
for i, t in enumerate(targets):
    print(f'{i}: {t.target_id[:12]}... {t.url}')
"
```

### 执行 JavaScript 并读取结果

```bash
browser-use python "cdp = browser._run(browser._session.get_or_create_cdp_session())"
browser-use python "result = browser._run(cdp.cdp_client.send.Runtime.evaluate(params={'expression': 'document.title', 'returnByValue': True}, session_id=cdp.session_id))"
browser-use python "print(result['result']['value'])"
```

### 开启移动端设备模拟

```bash
browser-use python "cdp = browser._run(browser._session.get_or_create_cdp_session())"
browser-use python "browser._run(cdp.cdp_client.send.Emulation.setDeviceMetricsOverride(params={'width': 375, 'height': 812, 'deviceScaleFactor': 3, 'mobile': True}, session_id=cdp.session_id))"
```

### 通过 CDP 直接读取 cookies

```bash
browser-use python "cdp = browser._run(browser._session.get_or_create_cdp_session())"
browser-use python "cookies = browser._run(cdp.cdp_client.send.Network.getCookies(params={}, session_id=cdp.session_id))"
browser-use python "print(cookies)"
```

## 提示

- 每次 `browser-use python` 只能执行一条语句；多行字符串可以写 `for` / `if`，但不要把表达式和多条语句混在一次调用里。
- 变量会跨调用持久化，所以先设 `cdp = ...`，再在下一次调用里继续用它。
- `browser._run()` 默认 60 秒超时；长耗时操作要么提高超时，要么直接走异步内部接口。
- 全部 CDP domain 都可以通过 `cdp.cdp_client.send.<Domain>.<method>()` 访问；完整 API 见 <https://chromedevtools.github.io/devtools-protocol/>。
