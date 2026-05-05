## 代码模式

- [插件开发模式](references/plugin-dev-patterns.md)

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
