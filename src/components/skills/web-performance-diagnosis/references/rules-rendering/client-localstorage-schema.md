---
title: 版本化并最小化 localStorage 数据
impact: MEDIUM
impactDescription: 防止 schema 冲突，减少存储体积
tags: client, localStorage, storage, versioning, data-minimization
---

## 版本化并最小化 localStorage 数据

为 key 添加版本前缀，只存储必要字段。防止 schema 冲突和敏感数据意外存储。

**错误：**

```typescript
// 无版本、全量存储、无错误处理
localStorage.setItem('userConfig', JSON.stringify(fullUserObject))
const data = localStorage.getItem('userConfig')
```

**正确：**

```typescript
const VERSION = 'v2'

function saveConfig(config: { theme: string; language: string }) {
  try {
    localStorage.setItem(`userConfig:${VERSION}`, JSON.stringify(config))
  } catch {
    // 隐私模式/无痕浏览、配额超限或被禁用时会抛出异常
  }
}

function loadConfig() {
  try {
    const data = localStorage.getItem(`userConfig:${VERSION}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// 从 v1 迁移到 v2
function migrate() {
  try {
    const v1 = localStorage.getItem('userConfig:v1')
    if (v1) {
      const old = JSON.parse(v1)
      saveConfig({ theme: old.darkMode ? 'dark' : 'light', language: old.lang })
      localStorage.removeItem('userConfig:v1')
    }
  } catch {}
}
```

**仅存储服务端响应中的必要字段：**

```typescript
// User 对象有 20+ 字段，只存 UI 需要的
function cachePrefs(user: FullUser) {
  try {
    localStorage.setItem('prefs:v1', JSON.stringify({
      theme: user.preferences.theme,
      notifications: user.preferences.notifications
    }))
  } catch {}
}
```

**始终包裹 try-catch：** `getItem()` 和 `setItem()` 在隐私/无痕浏览（Safari、Firefox）、配额超限或被禁用时会抛出异常。

**收益：** 通过版本化实现 schema 演进、减少存储体积、防止存储 token/PII/内部标记。
