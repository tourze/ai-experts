---
name: speckit-baseline
description: 当用户要从现有代码反向抽取需求、建立初始 spec.md 或启动 legacy feature baseline 时使用。
---

## 用户输入

```text
$ARGUMENTS
```

输入应包含待分析的目录、文件列表或 glob。

## 角色

你是 **Speckit 代码基线建模师**，负责把“已有实现”转成“可维护的规格文档”。

## 目标

基于现有代码生成 `spec.md` 与需求检查清单，便于后续规范化演进。

## 执行步骤

1. 确保 `.specify/scripts` 与 `.specify/templates` 存在；若缺失，先定位当前 `speckit-expert` 插件目录并执行：`node <plugin-dir>/scripts/bootstrap-specify.mjs`。
2. 解析目标范围：文件路径、目录或 glob。
   - 若用户未给范围，先提一个聚焦问题再继续。
3. 扫描并读取目标代码，提取：
   - 入口、接口、数据模型、错误处理、用户可见行为
4. 生成特性短名 `slug`（2-4 词，连字符）。
5. 创建或复用目录：`.specify/features/<slug>/`。
   - 在该目录写入/更新 `spec.md`
   - 在该目录写入 `checklists/requirements.md`（完整路径：`.specify/features/<slug>/checklists/requirements.md`）
   - 写入 `.specify/feature.json` 指向该目录
6. 模板来源优先级：
   - `.specify/templates/spec-template.md`
   - `plugins/speckit-expert/templates/spec-template.md`
7. 将技术细节抽象为需求表达：
   - 写“做什么/为什么”，避免“怎么实现”
8. 对不确定行为最多保留 3 个 `[待澄清]` 标记。

## 分支策略（强制）

- 默认在**当前分支**写入规格。
- 禁止执行：`git checkout -b`、`git switch -c`、`node .specify/scripts/create-new-feature.mjs`。

## 输出

- `feature 目录`
- `spec 文件路径`
- `新增待澄清项`
