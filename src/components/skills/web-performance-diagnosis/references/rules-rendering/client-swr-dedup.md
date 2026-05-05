---
title: 使用 SWR 实现请求自动去重
impact: MEDIUM-HIGH
impactDescription: 请求自动去重
tags: client, swr, deduplication, data-fetching
---

## 使用 SWR 实现请求自动去重

SWR 提供跨组件实例的请求去重、缓存和重新验证。

**错误（无去重，每个实例各自请求）：**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])
}
```

**正确（多个实例共享一次请求）：**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users } = useSWR('/api/users', fetcher)
}
```

**不可变数据场景：**

```tsx
import { useImmutableSWR } from '@/lib/swr'

function StaticContent() {
  const { data } = useImmutableSWR('/api/config', fetcher)
}
```

**变更操作场景：**

```tsx
import { useSWRMutation } from 'swr/mutation'

function UpdateButton() {
  const { trigger } = useSWRMutation('/api/user', updateUser)
  return <button onClick={() => trigger()}>Update</button>
}
```

参考：[https://swr.vercel.app](https://swr.vercel.app)
