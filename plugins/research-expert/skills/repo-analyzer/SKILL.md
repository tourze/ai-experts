---
name: repo-analyzer
description: 当用户要克隆或分析外部 GitHub 仓库、评估开源项目质量、生成仓库结构化报告或做技术选型调研时使用。支持 --persist 将分析结果保存为可复用的 skill 文件。
context: fork
agent: research-expert:deep-researcher
---

# 仓库分析

## 适用场景

- 用户给出 GitHub/GitLab URL，要求"分析这个项目""看看这个仓库"。
- 评估开源项目是否值得采用：活跃度、架构、社区、许可证。
- 如果只是深挖本地代码库的调用链，转到 [wiki-researcher](../wiki-researcher/SKILL.md)。
- 如果要对比两个仓库或方案，转到 [comparative-analysis](../comparative-analysis/SKILL.md)。
- 如果要深度精读并生成可复用的认知型 skill，转到 [deep-code-read](../deep-code-read/SKILL.md)。

## 核心约束

- 克隆到 `/tmp/` 下，`--depth=50` 浅克隆，不污染工作区。
- 先读 README、LICENSE、构建配置，建立全景认知。
- 用 `git log --oneline -30` 和 `git shortlog -sn --no-merges` 判断维护状态。
- 必须进入核心文件实际读代码，不能只凭文件名下结论。
- 区分"文档声称的"和"代码实际做的"。
- 按 [输出模板](references/output-template.md) 输出结构化报告。
- 如果用户指定 `--persist <dir>` 或要求"保存为 skill"，除报告外，额外在 `<dir>/<repo-name>-report/` 生成 SKILL.md，将分析结果持久化为可复用的 skill 文件。格式见 [持久化模板](references/persist-template.md)。

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

### FAIL: 只读 README 就下结论

```
该项目号称"零配置、高性能、企业级"。建议采用。
→ 没看代码、没查 git log、没验证声称是否属实
```

### PASS: 文档 + 代码 + 历史交叉验证

```
- 文档声称："零配置"
- 代码验证：config/ 下 12 个必填 env 变量（.env.example:3-15）
- 维护状态：last commit 14 个月前，2 个未解决 P0 issue
- 代码质量：抽样 src/core/engine.ts，异常处理仅 3 处
- 风险：许可证 AGPL-3.0，商业使用需评估
- 建议：适合内部工具，不适合商业产品
```

### FAIL: 用 star 数代替质量评估

```
28k stars → "项目很好，可以用"
→ star 多 ≠ 代码质量高，可能是早期流量红利
```

### PASS: 多维度健康度

```bash
git log --oneline --since='6 months ago' | wc -l   # 近半年提交
git shortlog -sn --no-merges | head                # 贡献者集中度
gh issue list --state open --label bug | wc -l     # 未决 bug
```
