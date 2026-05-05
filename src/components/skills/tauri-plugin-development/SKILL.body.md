## 核心约束
- 入口返回 `TauriPlugin<R>`，`Builder::new("name").build()`；名称不含前缀
- 移动端拆 `mobile.rs` + `desktop.rs`，公共 trait 定义接口
- 状态通过 `Builder.setup()` 中 `app.manage()` 注入
- JS 用 `invoke("plugin:<name>|<cmd>")`，参数 camelCase
- 权限放 `permissions/`，`default.toml` 定义最小默认集
- JS 包名与 Rust crate 名对应
- 始终提供 Builder 模式让宿主可配置

## 代码模式

- [插件开发模式](references/plugin-dev-patterns.md)

## 检查清单
- 入口是否 `Builder::new("name").build()`？
- 移动端是否拆分并用公共 trait？
- `default.toml` 是否定义最小权限？
- `on_event` 是否处理 `RunEvent::Exit`？

## 反模式

### FAIL: 硬编码无 Builder

```rust
pub fn init() -> TauriPlugin<R> {
    Plugin::new("myplugin").setup(|app, _| {
        app.manage(MyState { api_url: "https://prod.example.com".into() });
        Ok(())
    }).build()
}
// 宿主无法配置不同环境
```

### PASS: Builder 模式

```rust
pub struct Builder { api_url: String }
impl Builder {
    pub fn new() -> Self { Self { api_url: "https://prod.example.com".into() } }
    pub fn api_url(mut self, u: impl Into<String>) -> Self { self.api_url = u.into(); self }
    pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
        Plugin::new("myplugin").setup(move |app, _| {
            app.manage(MyState { api_url: self.api_url }); Ok(())
        }).build()
    }
}
```

### FAIL: JS invoke 无 plugin: 前缀

```ts
await invoke("getValue");  // 找不到命令
```

### PASS: plugin:name|cmd

```ts
await invoke("plugin:myplugin|getValue");
```

详见 [references/](references/)。
