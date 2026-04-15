# Monorepo 目录布局与依赖规则

## 推荐结构

```
my-cross-platform-app/
├── packages/
│   ├── shared-core/          # 接口、类型、领域逻辑、纯函数
│   │   ├── src/
│   │   │   ├── storage.ts        # 适配器接口
│   │   │   ├── di.ts             # DI 容器
│   │   │   ├── models/           # 领域模型（纯类型）
│   │   │   └── services/         # 领域服务（纯逻辑）
│   │   └── package.json
│   ├── platform-rn/          # React Native 适配器
│   │   ├── src/
│   │   │   ├── storage.ts        # AsyncStorage 实现
│   │   │   └── notification.ts   # react-native-push 实现
│   │   └── package.json          # 依赖: shared-core + RN 原生模块
│   ├── platform-tauri/       # Tauri 适配器
│   │   ├── src/
│   │   │   ├── storage.ts        # @tauri-apps/plugin-store 实现
│   │   │   └── notification.ts   # @tauri-apps/plugin-notification 实现
│   │   └── package.json          # 依赖: shared-core + tauri 插件
│   ├── platform-web/         # Web 适配器
│   │   ├── src/
│   │   │   ├── storage.ts        # localStorage 实现
│   │   │   └── notification.ts   # Web Notification API 实现
│   │   └── package.json          # 依赖: shared-core
│   └── ui-shared/            # 跨平台 UI 组件（React 层）
│       ├── src/
│       │   └── SettingsScreen.tsx # 仅依赖 shared-core 接口
│       └── package.json
├── apps/
│   ├── mobile/               # React Native 入口
│   ├── desktop/              # Tauri 入口
│   └── web/                  # Vite/Next.js 入口
├── pnpm-workspace.yaml
└── turbo.json
```

## 依赖规则

| 包 | 可依赖 | 禁止依赖 |
|---|---|---|
| `shared-core` | 无平台依赖 | 任何 `platform-*`、任何原生模块 |
| `platform-*` | `shared-core` | 其他 `platform-*` |
| `ui-shared` | `shared-core` | 任何 `platform-*` |
| `apps/*` | `shared-core` + 对应 `platform-*` + `ui-shared` | 其他平台的 `platform-*` |

## 关键原则

- `shared-core` 零平台依赖，任何平台包和 app 都可以引用。
- `platform-*` 只依赖 `shared-core`，不互相引用。
- `apps/*` 选择一个 `platform-*` 包并在入口注册。
- `ui-shared` 只依赖 `shared-core` 接口，不引用任何 `platform-*` 包。
- 依赖方向始终为单向：`apps -> platform-* -> shared-core`。
- 用 workspace 工具（pnpm/turborepo）的 `--filter` 确保 CI 只构建受影响的包。
