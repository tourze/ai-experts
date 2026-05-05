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

## 反模式

### FAIL: 只有营销话术

```markdown
# MyApp
MyApp 是革命性的项目管理工具，致力于提供最好的用户体验。

## Contributing
Welcome!
```

→ 没有安装/启动/测试命令，新人 clone 完无从下手。

### PASS: 可复制执行的指令

````markdown
## 快速开始

```bash
npm install
cp .env.example .env        # 配置 DATABASE_URL
npm run migrate
npm run dev                  # http://localhost:3000
```

## 测试

```bash
npm test                     # 单元
npm run test:e2e             # E2E
```
````

### FAIL: 编造技术栈

```markdown
技术栈：React, Vue, Angular, MySQL, Postgres, MongoDB
```

→ 实际只用了其中 2 个。

### PASS: 读代码定位事实

```bash
cat package.json | rg '"(vue|react|angular)"'  # 确认框架
cat package.json | rg '"(pg|mysql|mongodb)"'   # 确认存储
```

只列真实依赖，缺失信息标"待补"。
