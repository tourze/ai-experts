---
name: tauri-react-integration
description: "当用户要集成 React 前端、invoke 封装、useInvoke Hook、事件监听生命周期、Router 深链接、WebView 限制或错误边界时使用。"
---

# Tauri v2 + React 集成

## 适用场景
- `invoke()` 封装为带 loading/error 的 Hook
- Tauri 事件 listen/unlisten 生命周期管理
- Rust-React 状态同步（事件驱动）
- React Router + 深链接集成
- IPC 失败错误边界

## 核心约束
- WebView 无 Node.js API；系统访问必须 `invoke()`
- CSP 显式允许脚本源；dev server 绑定 localhost
- TS 类型与 Rust 结构体严格同步，禁 `any`
- React 与 Rust 状态独立，必须显式同步
- 深链接同时在 Rust `on_open_url` 和 React Router 处理
- `useTauriEvent` cleanup 必须 unlisten 并处理卸载竞态
- Error Boundary 捕获 IPC Promise rejection

## 代码模式

- [React 集成 Hooks](references/react-integration-patterns.md)
- [深链接与状态同步](references/deeplink-state-sync-patterns.md)

## 检查清单
- 前端无 Node.js API 调用？
- `useInvoke` 处理 loading/error/success？
- `useTauriEvent` cleanup 调用 unlisten？
- Rust 变更后 `emit()` 通知前端？

## 反模式

### FAIL: listen 不 cleanup

```tsx
function Component() {
  useEffect(() => {
    listen("file-changed", (event) => {
      setData(event.payload);
    });
    // 没有 cleanup → 组件卸载后监听器仍存在
    // 多次挂载 = 多倍监听器 = 重复处理
  }, []);
}
```

### PASS: cleanup 调 unlisten

```tsx
function Component() {
  useEffect(() => {
    let unlistenFn: UnlistenFn | undefined;
    let cancelled = false;
    listen("file-changed", (event) => {
      setData(event.payload);
    }).then((fn) => {
      if (cancelled) fn();  // 卸载竞态：promise resolve 时已 cleanup
      else unlistenFn = fn;
    });
    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, []);
}
```

### FAIL: invoke 无 try/catch

```tsx
const handleClick = async () => {
  const data = await invoke<UserData>("load_user", { id: 1 });
  setUser(data);
};
// Rust 端报错 → unhandled rejection → 整个 React 树崩
```

### PASS: useInvoke Hook 封装

```tsx
function useInvoke<T>(cmd: string) {
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const run = async (args: any) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await invoke<T>(cmd, args);
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e as Error, data: null });
    }
  };
  return { ...state, run };
}
```

### FAIL: 假设状态自动同步

```rust
// Rust 端
let mut config = state.lock().unwrap();
config.theme = "dark".to_string();
// React 端不知道，UI 还是亮色
```

### PASS: 显式 emit + listen

```rust
config.theme = "dark".to_string();
app_handle.emit("config-changed", &*config)?;
```
```tsx
useTauriEvent("config-changed", (e) => setConfig(e.payload));
```

详见 [references/](references/)。
