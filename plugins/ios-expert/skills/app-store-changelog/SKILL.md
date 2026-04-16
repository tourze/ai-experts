---
name: app-store-changelog
description: 当用户要写 App Store 发布说明、版本更新文案或门店更新摘要时使用。
---

# App Store 发布说明

## 适用场景

- 需要从最近一个 tag 到当前版本提炼 App Store「新内容」文案。
- 用户给出两个 ref，希望生成某个版本区间的更新说明。
- 需要把技术提交整理成用户能看懂的发布摘要。

## 核心约束

- 先跑 `scripts/collect_release_changes.sh` 确认真实改动范围，不要凭提交标题想象功能。
- 只保留用户可感知改动：新功能、体验优化、缺陷修复；丢弃纯重构、CI、依赖升级、脚本调整。
- 每条文案都必须能追溯到真实提交或变更文件。
- 默认写成短句或短 bullet，不要出现内部术语、模块名、PR 编号。

## 代码模式

### 收集版本区间

```bash
bash scripts/collect_release_changes.sh
bash scripts/collect_release_changes.sh v1.2.3 HEAD
```

### 归纳用户可见主题

```text
新增：用户直接获得的新能力
优化：已有流程更快、更稳、更清晰
修复：真实故障、崩溃、错误状态、同步问题
```

### 生成门店文案

```text
- 支持更快地完成关键任务。
- 优化了导航与加载体验。
- 修复了若干影响稳定性的问题。
```

## 检查清单

- 确认脚本输出的 `Range` 与当前发布范围一致。
- 把提交按“新增 / 优化 / 修复”去重归类，不要逐提交翻译。
- 删除内部实现细节，例如“重构”“迁移”“升级依赖”“补日志”。
- 如果某条改动是否用户可见存在歧义，先标注假设再写文案。
- 交叉引用：需要门店增长策略时切到 `app-store-optimization`；需要审核风险视角时切到 `apple-appstore-reviewer`。

## 反模式

### FAIL: commit subject 直接翻译

```
git log v1.2.3..HEAD --oneline →
- "refactor: extract NetworkManager"
- "chore: bump SwiftLint to 0.55"
- "fix: NPE in OrderViewModel"

→ 门店文案：
"重构 NetworkManager；升级 SwiftLint；修复 OrderViewModel 空指针"
→ 用户："这是什么？"
```

### PASS: 按用户视角归类

```
1. 跑 scripts/collect_release_changes.sh v1.2.3 HEAD
2. 过滤掉 refactor/chore/test/CI 提交
3. 按"新增 / 优化 / 修复"重组：

新增：
- 支持订单批量导出为 PDF
优化：
- 启动速度提升约 30%
修复：
- 解决部分订单页空白显示问题
```

### FAIL: 工程改动伪装功能

```
git log → "迁移 SwiftUI 4.0"
门店文案 → "全新视觉系统！"
→ 用户：UI 没变，怎么"全新"了？审核也质疑虚假宣传
```

### PASS: 只写真用户可见的

```
SwiftUI 升级用户感知 = 0
→ 不写在门店文案里
→ 留给内部 release notes
```
