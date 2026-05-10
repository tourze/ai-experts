# shadcn/ui 集成

本 README 是 `shadcn-ui` skill 的补充导航。运行时入口以生成后的 `SKILL.md` 为准；不要通过外部 skill 包安装本目录内容。

## 运行时位置

构建后该 skill 会随当前平台产物一起输出：

```text
skills/shadcn-ui/
```

安装器应按当前平台 manifest 的 `install.skillEntries` 逐项复制或 symlink 这个 skill 目录，目标 skill 根目录以 `install.skillRoot` 为准。

不要在本 README 里写外部 skill 包安装命令；运行时以当前目录内容与平台 manifest 为准。

## 目录结构

```text
shadcn-ui/
├── SKILL.md
├── README.md
├── agents/
│   └── openai.yaml
└── references/
    ├── index.md
    ├── examples/
    │   ├── index.md
    │   ├── auth-layout.tsx
    │   ├── data-table.tsx
    │   └── form-pattern.tsx
    └── resources/
        ├── index.md
        ├── component-catalog.md
        ├── customization-guide.md
        ├── migration-guide.md
        └── setup-guide.md
```

## 使用边界

- 用 `shadcn-ui-verify-setup` procedure 验证 `components.json`、Tailwind、路径别名、全局样式和 `cn()` 工具函数。
- 添加组件优先使用 `npx shadcn@latest add <component>`，不要手抄半套组件源码。
- 复杂组合优先读取 `references/examples/`；初始化、组件目录、主题定制和迁移问题读取 `references/resources/`。
- 接入已有设计系统时先映射 token、字体、spacing 和主题变量，再落地组件。

## 常用入口

```bash
node <runtime-root>/procedures.js \
  --procedure-id shadcn-ui-verify-setup \
  --trigger-skill shadcn-ui
```

生成后的 `SKILL.md` 会渲染当前平台对应的完整命令示例。
