---
name: readme-blueprint-generator
description: 当用户要为仓库生成或重构 README.md 时使用。该技能会先梳理项目定位、技术栈、结构、开发流程和测试方式，再输出开发者可直接使用的 README 骨架。
---

# README 蓝图生成

## 适用场景

- 仓库没有 README，或 README 已经过时、信息零散、无法指导开发者入门。
- 用户希望自动扫描项目结构、`.github/copilot` 或 `copilot-instructions.md` 等资料来生成文档骨架。
- 输出要兼顾“快速上手”和“架构导航”，而不是只列文件树。
- 如需统一 Markdown 风格，可结合 [markdown-mermaid-writing](../markdown-mermaid-writing/SKILL.md)。

## 核心约束

- 先理解项目是什么、给谁用、怎么跑，再写 README。
- README 必须可执行：安装、启动、测试、关键目录都要能落地。
- 不把猜测写成事实；缺失信息应标成“待补”或“未发现”。
- 面向开发者的 README 不要混入大量市场宣传话术。

## 代码模式

```bash
rg --files .github . -g 'copilot-instructions.md' -g 'README*'
rg -n "scripts|test|lint|build|start" package.json pyproject.toml Cargo.toml Makefile
```

推荐的 README 骨架：

```markdown
# 项目名称
## 项目简介
## 技术栈
## 快速开始
## 项目结构
## 开发流程
## 测试与质量保障
```

## 检查清单

- 是否明确了项目定位、主要能力和运行前提。
- 是否给出了可复制执行的安装、启动、测试命令。
- 是否解释了关键目录，而不是只贴文件树。
- 是否写清楚了贡献方式、环境变量和常见问题入口。
- 若后续要写面向终端用户的指南，可转给 [user-guide-writing](../user-guide-writing/SKILL.md)。

## 反模式

- README 只有一段介绍，没有任何启动与验证指令。
- 盲目照搬模板，和真实项目结构不匹配。
- 不读代码和配置，就编造技术栈或运行方式。
- 对开发者最关心的问题避而不谈，例如测试和本地调试。
