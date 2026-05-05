# Tauri v2 + React 集成代码模式（Hooks）

## 模式 1：useInvoke Hook

```typescript
// src/hooks/useInvoke.ts
import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseInvokeReturn<T, A> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (args?: A) => Promise<T | null>;
  reset: () => void;
}

export function useInvoke<
  T,
  A extends Record<string, unknown> = Record<string, unknown>,
>(command: string): UseInvokeReturn<T, A> {
  const [state, setState] = useState<{
    data: T | null; error: string | null; loading: boolean;
  }>({ data: null, error: null, loading: false });

  const execute = useCallback(async (args?: A): Promise<T | null> => {
    setState({ data: null, error: null, loading: true });
    try {
      const result = await invoke<T>(command, args ?? {});
      setState({ data: result, error: null, loading: false });
      return result;
    } catch (err) {
      const message = typeof err === "string" ? err : JSON.stringify(err);
      setState({ data: null, error: message, loading: false });
      return null;
    }
  }, [command]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return { ...state, execute, reset };
}
```

**组件使用：**
```tsx
import { useEffect } from "react";
import { useInvoke } from "../hooks/useInvoke";

interface UserProfile { name: string; email: string; }

export function UserProfile() {
  const { data, error, loading, execute } = useInvoke<UserProfile>("get_user_profile");
  useEffect(() => { execute(); }, [execute]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Failed: {error}</div>;
  if (!data) return null;
  return <h2>{data.name} ({data.email})</h2>;
}
```

## 模式 2：useTauriEvent Hook

```typescript
// src/hooks/useTauriEvent.ts
import { useEffect, useRef } from "react";
import { listen, type UnlistenFn, type Event } from "@tauri-apps/api/event";

export function useTauriEvent<T>(
  eventName: string,
  handler: (payload: T) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let mounted = true;

    listen<T>(eventName, (event: Event<T>) => {
      if (mounted) handlerRef.current(event.payload);
    }).then((fn) => {
      if (mounted) { unlisten = fn; } else { fn(); }
    });

    return () => { mounted = false; unlisten?.(); };
  }, [eventName]);
}
```

**组件使用：**
```tsx
import { useState } from "react";
import { useTauriEvent } from "../hooks/useTauriEvent";

type SyncEvent =
  | { event: "SyncProgress"; data: { done: number; total: number } }
  | { event: "SyncComplete"; data: { synced: number } };

export function SyncStatus() {
  const [pct, setPct] = useState<number | null>(null);

  useTauriEvent<SyncEvent>("sync-event", (p) => {
    if (p.event === "SyncProgress") setPct(Math.round((p.data.done / p.data.total) * 100));
    else setPct(null);
  });

  return pct !== null ? <span>Syncing {pct}%</span> : <span>Synced</span>;
}
```
