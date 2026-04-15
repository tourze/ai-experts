---
name: repo-analyzer
description: 当用户要克隆或分析外部 GitHub 仓库、评估开源项目质量、生成仓库结构化报告或做技术选型调研时使用。
---

# 仓库分析

## 适用场景

- 用户给出 GitHub/GitLab URL，要求"分析这个项目""看看这个仓库"。
- 评估开源项目是否值得采用：活跃度、架构、社区、许可证。
- 如果只是深挖本地代码库的调用链，转到 [wiki-researcher](../wiki-researcher/SKILL.md)。
- 如果要对比两个仓库或方案，转到 [comparative-analysis](../comparative-analysis/SKILL.md)。

## 核心约束

- 克隆到 `/tmp/` 下，`--depth=50` 浅克隆，不污染工作区。
- 先读 README、LICENSE、构建配置，建立全景认知。
- 用 `git log --oneline -30` 和 `git shortlog -sn --no-merges` 判断维护状态。
- 必须进入核心文件实际读代码，不能只凭文件名下结论。
- 区分"文档声称的"和"代码实际做的"。
- 按 [输出模板](references/output-template.md) 输出结构化报告。

## 代码模式

```text
1. 获取：git clone --depth=50 <url> /tmp/<name>
2. 全景：README + LICENSE + 构建配置 + 目录结构 + 代码统计
3. 健康度：git log + shortlog + CI 配置 + Issues 模板
4. 代码质量：读 2-3 个核心文件，判断风格、抽象、错误处理、测试覆盖
5. 风险：依赖数量、许可证兼容性、密钥处理
6. 输出：结构化报告
```

## 检查清单

- 是否实际读了核心代码，而不只是 README 和目录名。
- 是否检查了 git 历史判断维护状态。
- 是否区分了"文档声称"和"代码实际"。
- 是否给出了结构化评分和证据。
- 是否在 `/tmp/` 下操作。

## 反模式

- 只读 README 就写报告。
- 用 star 数代替代码质量评估。
- 把文件名列表当作"架构分析"。
- 在用户工作区里 clone 仓库。
- 只说优点不提风险。
