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
